# LogicWeaver - 业务逻辑构建平台

> 将业务专家的"教"翻译成开发人员的"筑" —— Data Flow Specification 生成器

## 🎯 项目目标

**核心使命**：让不懂技术的业务专家，通过自然语言和演示，定义出开发人员可直接实现的 **数据契约（Data Flow Specification）**。

## 🔄 三方角色边界

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  上游：业务专家                                               │
│  ┌─────────────────┐                                        │
│  │ 只负责"教"       │  用自然语言 + 图片/语音 描述业务流程      │
│  │ （非技术人员）    │  例："拍一张照片，数一下有几个人"         │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  中游：LogicWeaver 平台                                       │
│  ┌─────────────────┐                                        │
│  │ 负责"译"        │  AI 自动生成 Data Flow Specification    │
│  │ （本平台）       │  定义：Input 是什么、Output 是什么       │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  下游：开发人员（Dify）                                        │
│  ┌─────────────────┐                                        │
│  │ 负责"筑"        │  根据数据契约自由选择技术实现            │
│  │ （技术人员）     │  可用 YOLO/GPT-4V/Python/人工 任选      │
│  └─────────────────┘                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## ⚡ 核心价值

**只定义"要什么"，不管"怎么做"。**

- ❌ 错误："用 YOLOv8 检测人数"
- ✅ 正确："Input: 一张图片；Output: person_count (int) 代表人数"

开发人员看到契约后可自由选择实现方式，只要返回的数据格式符合契约即可。

## 📊 输出示例

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
        "description": "上一步拍摄的办公室照片"
      }
    ],
    "outputs": [
      {
        "name": "person_count",
        "type": "int",
        "description": "图片中识别到的人数"
      }
    ],
    "acceptance_criteria": "人数统计误差不超过1人",
    "notes": "开发人员可自由选择实现方式"
  },
  "confidence_score": 0.95
}
```

## 🔄 使用流程

```
1. 创建工作流
   └─ Dashboard 页面创建新工作流

2. 采集步骤（Builder）
   ├─ 步骤名称：如"拍照"、"数人"
   ├─ 上下文描述：用自然语言描述这一步做什么
   ├─ 参考材料：上传图片/文本/语音
   └─ 点击"下一步"添加更多步骤

3. AI 分析
   └─ 点击"结束采集并去复核"
      ├─ 各步骤串行分析
      ├─ 自动传递前序输出作为下一步上下文
      └─ 生成 Data Flow Specification

4. 复核（Review）
   ├─ 左侧：源输入（用户填写的内容）
   ├─ 右侧：数据契约（AI 生成）
   └─ 左右对齐，方便逐步对照

5. 流程图（Flowchart）
   └─ 可视化展示数据流
      ├─ 每个节点显示：业务意图 / Inputs / Outputs
      └─ 连线显示数据流向
```

## 🏗️ 系统架构

```
LogicWeaver/
├── frontend/                  # React + TypeScript 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx  # 工作流列表
│   │   │   ├── Builder.tsx    # 步骤采集
│   │   │   ├── Review.tsx     # 复核页面
│   │   │   └── Flowchart.tsx  # 流程图
│   │   ├── components/
│   │   │   ├── builder/       # 采集组件
│   │   │   ├── review/        # 复核组件
│   │   │   └── flowchart/     # 流程图组件
│   │   └── hooks/
│   │       └── useAnalysis.ts # AI 分析 hooks
│   └── ...
│
├── backend/                   # FastAPI + Python 后端
│   ├── app/
│   │   ├── routers/
│   │   │   ├── analysis.py    # AI 分析 API
│   │   │   └── ...
│   │   └── services/
│   │       ├── ai_analysis.py # AI 分析服务
│   │       └── llm.py         # LLM 调用封装
│   └── ...
│
└── README.md
```

## 🔧 核心模块

### 1. AI 分析服务 (`ai_analysis.py`)

- **角色**：数据契约定义者
- **输入**：步骤描述 + 参考材料 + 前序输出
- **输出**：StepContract (inputs/outputs/acceptance_criteria)
- **特性**：上下文感知，确保变量名一致

### 2. LLM 服务 (`llm.py`)

- 支持 OpenAI 兼容 API（ChatGLM、GPT-4 等）
- 可配置 `LLM_API_BASE`、`LLM_API_KEY`、`LLM_MODEL`

### 3. 前端分析 Hook (`useAnalysis.ts`)

- `useAnalyzeStep()` - 分析单个步骤
- `useAnalyzeAllSteps()` - 批量分析（带上下文传递）

### 4. 复核页面 (`Review.tsx`)

- 左右分栏对齐显示
- 图片点击放大预览
- 数据契约可视化

### 5. 流程图 (`Flowchart.tsx` + `StepNode.tsx`)

- ReactFlow 可视化
- 节点显示：业务意图 / In / Out
- 节点连线展示数据流

## 🚀 快速开始

### 环境配置

1. **后端 `.env`**：
```bash
LLM_ENABLED=true
LLM_PROVIDER=openai
LLM_API_BASE=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=your_api_key
LLM_MODEL=glm-4
```

2. **启动后端**：
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. **启动前端**：
```bash
cd frontend
npm install
npm run dev
```

## 📚 数据类型

常用类型（用于 inputs/outputs）：

| 类型 | 说明 |
|------|------|
| `string` | 文本 |
| `int` | 整数 |
| `float` | 浮点数 |
| `bool` | 布尔值 |
| `image` | 图片（URL 或 base64） |
| `file` | 文件路径 |
| `list[string]` | 字符串列表 |
| `dict` | 字典/对象 |

## 🎓 设计原则

1. **只定义契约，不定技术** - 绝不提及 YOLO/GPT/Python 等
2. **变量名用英文蛇形命名法** - 如 `person_count`, `office_image`
3. **上下游衔接** - 下一步的 input 应能接上一步的 output
4. **业务意图清晰** - 用一句话说清楚这一步要做什么

## 📄 License

MIT License
