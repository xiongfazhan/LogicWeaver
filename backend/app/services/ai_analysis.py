"""AI Analysis Service for step description and materials analysis.

Uses LLM to analyze user's step descriptions and uploaded materials to generate:
- Technical implementation plan for Dify developers
- Model selection and configuration
- Dify node configuration suggestions
"""

import json
import logging
from typing import Optional
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.workflow import WorkflowStep
from app.repositories.step import StepRepository
from app.services.llm import LLMService, LLMServiceError, get_llm_service

logger = logging.getLogger(__name__)


# ============================================================================
# Response Models - Data Flow Specification
# ============================================================================


class DataField(BaseModel):
    """数据字段定义"""
    name: str               # 字段名（英文蛇形命名）
    type: str               # 数据类型: string, int, float, bool, image, file, list[string], dict 等
    description: str        # 字段说明（中文）
    required: bool = True   # 是否必填
    example: Optional[str] = None  # 示例值


class StepContract(BaseModel):
    """单个步骤的数据契约 - Data Flow Specification"""
    step_id: int                      # 步骤序号
    step_name: str                    # 步骤名称（中文）
    business_intent: str              # 业务意图（一句话说清楚这一步做什么）
    
    # 数据契约
    inputs: list[DataField]           # 输入：这一步需要什么
    outputs: list[DataField]          # 输出：这一步必须返回什么
    
    # 可选的业务说明
    acceptance_criteria: Optional[str] = None  # 验收标准（怎样算"做好了"）
    notes: Optional[str] = None                # 备注


class AnalysisResult(BaseModel):
    """AI 分析结果 - Step Contract (数据契约)"""
    contract: StepContract            # 本步骤的数据契约
    confidence_score: float           # 分析置信度


class AnalysisResponse(BaseModel):
    """API response for analysis endpoint."""
    step_id: str
    step_name: str
    result: AnalysisResult
    llm_model: str
    has_materials: bool


# ============================================================================
# Exceptions
# ============================================================================


class AnalysisError(Exception):
    """Base exception for analysis errors."""
    pass


class InsufficientExamplesError(AnalysisError):
    """Raised when there are not enough examples for analysis."""
    pass


class StepNotFoundError(AnalysisError):
    """Raised when step is not found."""
    pass


# ============================================================================
# Analysis Prompt - 数据契约定义者
# ============================================================================


ANALYSIS_PROMPT_TEMPLATE = """你是一个"数据契约定义者"，负责将业务需求翻译成 Data Flow Specification（数据流规格说明书）。

## 你的角色
- 上游（业务人员）：只负责"教"（用自然语言描述需求）
- 你（平台）：负责"译"（定义清晰的数据契约：Input 是什么、Output 是什么）
- 下游（开发人员）：负责"筑"（根据契约自由选择技术实现）

## 核心原则
**你只定义"要什么"，不管"怎么做"。**

例如：
- ❌ 错误："用 YOLOv8 检测人数"
- ✅ 正确："Input: 一张图片；Output: person_count (int) 代表人数"

开发人员看到契约后，可以自由选择：
- 用 YOLO 检测
- 用 GPT-4V 视觉理解
- 甚至用人工标注
只要返回的数据格式符合契约，就算合格。

## 数据类型
常用类型：
- `string` - 文本
- `int` - 整数
- `float` - 浮点数
- `bool` - 布尔值
- `image` - 图片（URL 或 base64）
- `file` - 文件路径
- `list[string]` - 字符串列表
- `dict` - 字典/对象

## 输出格式
请严格按照以下 JSON 格式输出：
```json
{
  "contract": {
    "step_id": 1,
    "step_name": "步骤中文名",
    "business_intent": "业务意图（一句话）",
    "inputs": [
      {
        "name": "input_field_name",
        "type": "数据类型",
        "description": "字段说明",
        "required": true,
        "example": "示例值"
      }
    ],
    "outputs": [
      {
        "name": "output_field_name",
        "type": "数据类型",
        "description": "字段说明",
        "required": true,
        "example": "示例值"
      }
    ],
    "acceptance_criteria": "验收标准（可选）",
    "notes": "备注（可选）"
  },
  "confidence_score": 0.9
}
```

## 示例

**用户输入:** "拍一张办公室照片"
**输出:**
```json
{
  "contract": {
    "step_id": 1,
    "step_name": "拍摄照片",
    "business_intent": "采集办公室现场照片",
    "inputs": [],
    "outputs": [
      {
        "name": "office_image",
        "type": "image",
        "description": "办公室现场照片",
        "required": true,
        "example": "https://example.com/office.jpg"
      }
    ],
    "acceptance_criteria": "照片清晰，能看清室内全景",
    "notes": null
  },
  "confidence_score": 0.95
}
```

**用户输入:** "数一下有几个人"
**输出:**
```json
{
  "contract": {
    "step_id": 2,
    "step_name": "统计人数",
    "business_intent": "统计图片中的人数",
    "inputs": [
      {
        "name": "office_image",
        "type": "image",
        "description": "上一步拍摄的办公室照片",
        "required": true,
        "example": null
      }
    ],
    "outputs": [
      {
        "name": "person_count",
        "type": "int",
        "description": "图片中识别到的人数",
        "required": true,
        "example": "5"
      }
    ],
    "acceptance_criteria": "人数统计误差不超过1人",
    "notes": "开发人员可自由选择实现方式（CV/VLM/人工）"
  },
  "confidence_score": 0.95
}
```

**用户输入:** "把人数填到 Excel 表里"
**输出:**
```json
{
  "contract": {
    "step_id": 3,
    "step_name": "写入表格",
    "business_intent": "将人数记录到 Excel 表格",
    "inputs": [
      {
        "name": "person_count",
        "type": "int",
        "description": "上一步统计的人数",
        "required": true,
        "example": "5"
      }
    ],
    "outputs": [
      {
        "name": "excel_file",
        "type": "file",
        "description": "更新后的 Excel 文件",
        "required": true,
        "example": "report_2024.xlsx"
      },
      {
        "name": "success",
        "type": "bool",
        "description": "是否写入成功",
        "required": true,
        "example": "true"
      }
    ],
    "acceptance_criteria": "Excel 中对应单元格已更新",
    "notes": null
  },
  "confidence_score": 0.90
}
```

## 关键原则
1. **只定义契约，不定技术** - 绝不提及 YOLO/GPT/Python 等
2. **变量名用英文蛇形命名法** - 如 person_count, office_image
3. **上下游衔接** - 下一步的 input 应该能接上一步的 output
4. **业务意图清晰** - 用一句话说清楚这一步要做什么
"""


class AIAnalysisService:
    """Service for AI-powered step analysis."""

    def __init__(
        self,
        db: Session,
        llm_service: Optional[LLMService] = None,
    ):
        """Initialize analysis service."""
        self.db = db
        self.step_repo = StepRepository(db)
        self.llm = llm_service or get_llm_service()

    def analyze_step_examples(
        self, 
        step_id: UUID,
        previous_outputs: Optional[list[dict]] = None,
    ) -> AnalysisResponse:
        """
        Analyze a step's description and materials.
        
        Args:
            step_id: UUID of the step
            previous_outputs: 前序步骤的输出变量列表，格式:
                [{"name": "office_image", "type": "image", "description": "..."}]
            
        Returns:
            AnalysisResponse with analysis result
        """
        # Get step
        step = self.step_repo.get_by_id(step_id)
        if not step:
            raise StepNotFoundError(f"Step {step_id} not found")

        # Build analysis input from step data (with context)
        analysis_input = self._build_step_input(step, previous_outputs)
        
        # Check if there's anything to analyze
        has_materials = bool(
            step.context_image_url or 
            step.context_text_content or 
            step.context_voice_transcript
        )
        has_description = bool(
            step.context_description or 
            step.logic_evaluation_prompt
        )
        
        if not has_description and not has_materials:
            # 什么都没填，返回空结果
            return AnalysisResponse(
                step_id=str(step_id),
                step_name=step.name or "未命名步骤",
                result=AnalysisResult(
                    contract=StepContract(
                        step_id=0,
                        step_name="未配置",
                        business_intent="步骤描述为空",
                        inputs=[],
                        outputs=[],
                        acceptance_criteria=None,
                        notes="请先填写步骤描述",
                    ),
                    confidence_score=0.0,
                ),
                llm_model=self.llm.model,
                has_materials=False,
            )
        
        # Call LLM
        try:
            raw_result = self.llm.analyze_text(
                prompt=ANALYSIS_PROMPT_TEMPLATE,
                content=analysis_input,
            )
            
            # Parse result
            result = self._parse_analysis_result(raw_result)
            
            return AnalysisResponse(
                step_id=str(step_id),
                step_name=step.name or "未命名步骤",
                result=result,
                llm_model=self.llm.model,
                has_materials=has_materials,
            )

        except LLMServiceError as e:
            logger.error(f"LLM analysis failed: {e}")
            raise AnalysisError(f"AI analysis failed: {e}")

    def _build_step_input(
        self, 
        step: WorkflowStep,
        previous_outputs: Optional[list[dict]] = None,
    ) -> str:
        """Build input text for LLM analysis from step data."""
        parts = []
        
        # 上下文：前序步骤的输出（可用作本步骤的输入）
        if previous_outputs:
            context_lines = ["## 上下文：前序步骤的输出变量"]
            context_lines.append("你可以在定义本步骤的 inputs 时直接使用这些变量名：")
            for output in previous_outputs:
                name = output.get("name", "unknown")
                dtype = output.get("type", "string")
                desc = output.get("description", "")
                context_lines.append(f"- `{name}` ({dtype}): {desc}")
            context_lines.append("")
            context_lines.append("**注意：本步骤的 inputs 如果来自前序步骤，必须使用上述变量名！**")
            parts.append("\n".join(context_lines))
        
        # Step name
        if step.name:
            parts.append(f"## 步骤名称\n{step.name}")
        
        # Step description (main content)
        description = step.context_description or step.logic_evaluation_prompt
        if description:
            parts.append(f"## 步骤描述\n{description}")
        
        # Materials
        materials = []
        if step.context_image_url:
            materials.append(f"- 图片材料: {step.context_image_url}")
        if step.context_text_content:
            text = step.context_text_content
            if len(text) > 500:
                text = text[:500] + "..."
            materials.append(f"- 文本材料:\n{text}")
        if step.context_voice_transcript:
            voice = step.context_voice_transcript
            if len(voice) > 500:
                voice = voice[:500] + "..."
            materials.append(f"- 语音转写:\n{voice}")
        
        if materials:
            parts.append("## 参考材料\n" + "\n".join(materials))
        
        return "\n\n".join(parts)

    def _parse_analysis_result(self, raw_result: str) -> AnalysisResult:
        """Parse LLM response into AnalysisResult (数据契约)."""
        try:
            # Extract JSON from response
            if "```json" in raw_result:
                start = raw_result.find("```json") + 7
                end = raw_result.find("```", start)
                json_str = raw_result[start:end].strip()
            elif "```" in raw_result:
                start = raw_result.find("```") + 3
                end = raw_result.find("```", start)
                json_str = raw_result[start:end].strip()
            else:
                json_str = raw_result.strip()
            
            data = json.loads(json_str)
            
            # Parse contract
            contract_data = data.get("contract", {})
            
            # Parse inputs
            inputs = []
            for field_data in contract_data.get("inputs", []):
                inputs.append(DataField(
                    name=field_data.get("name", "unknown"),
                    type=field_data.get("type", "string"),
                    description=field_data.get("description", ""),
                    required=field_data.get("required", True),
                    example=field_data.get("example"),
                ))
            
            # Parse outputs
            outputs = []
            for field_data in contract_data.get("outputs", []):
                outputs.append(DataField(
                    name=field_data.get("name", "unknown"),
                    type=field_data.get("type", "string"),
                    description=field_data.get("description", ""),
                    required=field_data.get("required", True),
                    example=field_data.get("example"),
                ))
            
            contract = StepContract(
                step_id=int(contract_data.get("step_id", 1)),
                step_name=contract_data.get("step_name", "未命名步骤"),
                business_intent=contract_data.get("business_intent", ""),
                inputs=inputs,
                outputs=outputs,
                acceptance_criteria=contract_data.get("acceptance_criteria"),
                notes=contract_data.get("notes"),
            )
            
            return AnalysisResult(
                contract=contract,
                confidence_score=float(data.get("confidence_score", 0.5)),
            )

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.warning(f"Failed to parse LLM response as JSON: {e}")
            # Return a fallback result
            return AnalysisResult(
                contract=StepContract(
                    step_id=0,
                    step_name="解析错误",
                    business_intent="LLM 响应解析失败",
                    inputs=[],
                    outputs=[],
                    acceptance_criteria=None,
                    notes=f"原始响应: {raw_result[:200] if raw_result else '空'}",
                ),
                confidence_score=0.0,
            )
