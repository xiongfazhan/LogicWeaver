"""Protocol service for generating Protocol JSON from workflows."""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.workflow import Example, RoutingBranch, Workflow, WorkflowStep
from app.repositories.workflow import WorkflowRepository
from app.schemas.protocol import (
    ProtocolFewShotExample,
    ProtocolInputSpec,
    ProtocolLogicConfig,
    ProtocolOutputField,
    ProtocolOutputSchema,
    ProtocolRoutingBranch,
    ProtocolRoutingMap,
    ProtocolStep,
    ProtocolWorkflow,
)


# ============================================================================
# Logic Strategy Mapping
# ============================================================================

# 内部存储�?-> 输出协议�?
LOGIC_STRATEGY_MAPPING: dict[str, str] = {
    "rule_based": "RULE_BASED",
    "few_shot": "SEMANTIC_SIMILARITY",  # 关键映射�?
}

# 输出协议�?-> 内部存储�?(反向映射)
LOGIC_STRATEGY_REVERSE_MAPPING: dict[str, str] = {
    v: k for k, v in LOGIC_STRATEGY_MAPPING.items()
}


def map_logic_strategy_to_protocol(internal_value: Optional[str]) -> str:
    """将内部存储的 logic_strategy 转换为协议输出格式�?
    
    Args:
        internal_value: 内部存储的策略�?(rule_based �?few_shot)
        
    Returns:
        协议格式的策略�?(RULE_BASED �?SEMANTIC_SIMILARITY)
    """
    if internal_value is None:
        return "RULE_BASED"  # 默认�?
    return LOGIC_STRATEGY_MAPPING.get(internal_value, internal_value.upper())


def map_logic_strategy_from_protocol(protocol_value: str) -> str:
    """将协议格式的 logic_strategy 转换为内部存储格式�?
    
    Args:
        protocol_value: 协议格式的策略�?(RULE_BASED �?SEMANTIC_SIMILARITY)
        
    Returns:
        内部存储的策略�?(rule_based �?few_shot)
    """
    return LOGIC_STRATEGY_REVERSE_MAPPING.get(protocol_value, protocol_value.lower())


# ============================================================================
# Exceptions
# ============================================================================


class WorkflowNotFoundError(Exception):
    """Raised when a workflow is not found."""

    def __init__(self, workflow_id: UUID):
        self.workflow_id = workflow_id
        super().__init__(f"Workflow with id {workflow_id} not found")


# ============================================================================
# Protocol Service
# ============================================================================


class ProtocolService:
    """Service for generating Protocol JSON from workflows."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.repository = WorkflowRepository(db)

    def generate_protocol(self, workflow_id: UUID) -> ProtocolWorkflow:
        """Generate Protocol JSON from a workflow.
        
        Args:
            workflow_id: The UUID of the workflow to convert
            
        Returns:
            ProtocolWorkflow object containing the protocol JSON structure
            
        Raises:
            WorkflowNotFoundError: If the workflow is not found
        """
        workflow = self.repository.get_by_id(workflow_id)
        if not workflow:
            raise WorkflowNotFoundError(workflow_id)
        
        return self._convert_workflow_to_protocol(workflow)

    def _convert_workflow_to_protocol(self, workflow: Workflow) -> ProtocolWorkflow:
        """Convert a Workflow model to ProtocolWorkflow schema.
        
        Args:
            workflow: The Workflow model to convert
            
        Returns:
            ProtocolWorkflow schema object
        """
        protocol_steps = [
            self._convert_step_to_protocol(step)
            for step in workflow.steps
        ]
        
        return ProtocolWorkflow(
            workflow_id=str(workflow.id),
            workflow_name=workflow.name,
            steps=protocol_steps,
        )

    def _convert_step_to_protocol(self, step: WorkflowStep) -> ProtocolStep:
        """Convert a WorkflowStep model to ProtocolStep schema.
        
        Args:
            step: The WorkflowStep model to convert
            
        Returns:
            ProtocolStep schema object
        """
        return ProtocolStep(
            step_id=str(step.id),
            step_name=step.name,
            business_domain=self._extract_business_domain(step),
            input_spec=self._build_input_spec(step),
            logic_config=self._build_logic_config(step),
            routing_map=self._build_routing_map(step),
            output_schema=self._build_output_schema(step),
        )

    def _extract_business_domain(self, step: WorkflowStep) -> str:
        """Extract business domain from step context.
        
        Args:
            step: The WorkflowStep model
            
        Returns:
            Business domain string (defaults to workflow name or 'general')
        """
        # �?context_description �?workflow name 推断业务领域
        if step.context_description:
            return step.context_description[:100]  # 截取�?00字符
        if step.workflow and step.workflow.name:
            return step.workflow.name
        return "general"

    def _build_input_spec(self, step: WorkflowStep) -> ProtocolInputSpec:
        """Build input specification from step context data.
        
        Args:
            step: The WorkflowStep model
            
        Returns:
            ProtocolInputSpec schema object
        """
        # 确定数据源类�?
        data_source = step.context_type or "unknown"
        
        # 确定目标区域
        target_section = ""
        if step.context_image_url:
            target_section = step.context_image_url
        elif step.context_text_content:
            target_section = step.context_text_content[:200]  # 截取�?00字符
        elif step.context_voice_transcript:
            target_section = step.context_voice_transcript[:200]
        
        # 上下文描�?
        context_description = step.context_description or ""
        
        # 添加提取关键词信�?
        if step.extraction_keywords:
            keywords_str = ", ".join(step.extraction_keywords)
            context_description = f"{context_description} [Keywords: {keywords_str}]".strip()
        
        return ProtocolInputSpec(
            data_source=data_source,
            target_section=target_section,
            context_description=context_description,
        )

    def _build_logic_config(self, step: WorkflowStep) -> ProtocolLogicConfig:
        """Build logic configuration from step logic data.
        
        Args:
            step: The WorkflowStep model
            
        Returns:
            ProtocolLogicConfig schema object
        """
        # 映射 logic_strategy
        logic_strategy = map_logic_strategy_to_protocol(step.logic_strategy)
        
        # 构建 few_shot_examples (如果使用 few_shot 策略)
        few_shot_examples = None
        if step.logic_strategy == "few_shot" and step.examples:
            few_shot_examples = [
                self._convert_example_to_protocol(example)
                for example in step.examples
            ]
        
        return ProtocolLogicConfig(
            logic_strategy=logic_strategy,  # type: ignore
            rule_expression=step.logic_rule_expression,
            few_shot_examples=few_shot_examples,
            evaluation_prompt=step.logic_evaluation_prompt,
        )

    def _convert_example_to_protocol(self, example: Example) -> ProtocolFewShotExample:
        """Convert an Example model to ProtocolFewShotExample schema.
        
        Args:
            example: The Example model to convert
            
        Returns:
            ProtocolFewShotExample schema object
        """
        return ProtocolFewShotExample(
            content=example.content,
            label=example.label,  # type: ignore (already 'PASS' or 'FAIL')
            description=example.description or "",
        )

    def _build_routing_map(self, step: WorkflowStep) -> ProtocolRoutingMap:
        """Build routing map from step routing data.
        
        Args:
            step: The WorkflowStep model
            
        Returns:
            ProtocolRoutingMap schema object
        """
        # 默认下一�?
        default_next = step.routing_default_next or "next"
        
        # 构建分支列表
        branches = [
            self._convert_branch_to_protocol(branch)
            for branch in step.routing_branches
        ]
        
        return ProtocolRoutingMap(
            default_next=default_next,
            branches=branches,
        )

    def _convert_branch_to_protocol(
        self, branch: RoutingBranch
    ) -> ProtocolRoutingBranch:
        """Convert a RoutingBranch model to ProtocolRoutingBranch schema.
        
        Args:
            branch: The RoutingBranch model to convert
            
        Returns:
            ProtocolRoutingBranch schema object
        """
        return ProtocolRoutingBranch(
            condition_result=branch.condition_result,
            action_type=branch.action_type,
            next_step_id=branch.next_step_id,
        )

    def _build_output_schema(self, step: WorkflowStep) -> ProtocolOutputSchema:
        """Build output schema from step data.
        
        Args:
            step: The WorkflowStep model
            
        Returns:
            ProtocolOutputSchema schema object
        """
        # 根据提取关键词生成输出字�?
        fields: list[ProtocolOutputField] = []
        
        if step.extraction_keywords:
            for keyword in step.extraction_keywords:
                fields.append(ProtocolOutputField(
                    name=keyword,
                    type="string",
                ))
        
        # 添加默认的判断结果字�?
        fields.append(ProtocolOutputField(
            name="judgment_result",
            type="string",
        ))
        
        return ProtocolOutputSchema(fields=fields)
