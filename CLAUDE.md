# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**LogicWeaver** 是一个业务逻辑构建平台，核心使命是"将业务专家的'教'翻译成开发人员的'筑'"，通过 AI 自动生成 **Data Flow Specification（数据流规格说明书）**。项目采用"教-译-筑"三阶解耦架构：

- **上游（业务专家）**：只负责"教" - 用自然语言+图片/语音描述业务流程
- **中游（LogicWeaver）**：负责"译" - AI 自动生成数据契约（定义 Input/Output）
- **下游（开发人员）**：负责"筑" - 根据数据契约自由选择技术实现

## 开发命令

### 启动服务
```bash
# 启动数据库
docker-compose up -d

# 启动后端（端口 8000）
cd backend && uvicorn app.main:app --reload

# 启动前端（端口 5173）
cd frontend && npm run dev
```

### 根目录脚本
```bash
npm run frontend:dev    # 启动前端开发服务器
npm run frontend:build  # 构建前端生产版本
npm run backend:dev     # 启动后端开发服务器
npm run backend:test    # 运行后端测试
```

### 前端脚本（在 frontend/ 目录下）
```bash
npm run dev             # Vite 开发服务器
npm run build           # TypeScript 编译 + Vite 构建
npm run lint            # ESLint 检查
npm run test            # Vitest 运行测试
npm run generate-api    # 从 OpenAPI 生成 TypeScript 客户端
```

### 后端脚本（在 backend/ 目录下）
```bash
pytest                                 # 运行所有测试
pytest -v                              # 详细输出
pytest tests/test_analysis_api.py      # 运行特定测试
alembic upgrade head                    # 应用数据库迁移
alembic revision --autogenerate -m "message"  # 创建新迁移
```

## 技术架构

### 前端技术栈
- React 18.3.1 + TypeScript 5.6.2
- Vite 6.0.1（构建工具）
- React Router v6.28.0（路由）
- Tailwind CSS + Shadcn/UI（UI 框架）
- @xyflow/react 12.3.6（流程图）
- Zustand 5.0.2（全局状态）+ @tanstack/react-query 5.62.0（服务器状态）

### 后端技术栈
- FastAPI（Python 3.11+）
- SQLAlchemy 2.0.0 + asyncpg（异步 PostgreSQL）
- Alembic 1.13.0（数据库迁移）
- Pydantic v2.5.0（数据验证）
- OpenAI SDK 1.12.0（LLM 集成，兼容 ChatGLM/GPT-4）

### 分层架构（后端）
```
Request → Router (FastAPI路由)
         ↓
         Service (业务逻辑, LLM调用)
         ↓
         Repository (数据库操作)
         ↓
         Model (SQLAlchemy ORM)
         ↓
         Database (PostgreSQL)
```

## 核心设计原则

**核心原则**：只定义"要什么"，不管"怎么做"

- ❌ 错误："用 YOLOv8 检测人数"
- ✅ 正确："Input: 一张图片；Output: person_count (int) 代表人数"

### 数据契约定义规则
1. **只定义契约，不定技术** - 绝不提及 YOLO/GPT/Python 等
2. **变量名用英文蛇形命名法** - 如 `person_count`, `office_image`
3. **上下游衔接** - 下一步的 input 应能接上一步的 output
4. **业务意图清晰** - 用一句话说清楚这一步要做什么

### 数据类型
- `string` - 文本
- `int` - 整数
- `float` - 浮点数
- `bool` - 布尔值
- `image` - 图片（URL 或 base64）
- `file` - 文件路径
- `list[string]` - 字符串列表
- `dict` - 字典/对象

## 代码结构

### 前端页面（5 个主页面）
- `Dashboard.tsx` - 工作流列表/仪表盘
- `WorkerCollect.tsx` - 工人采集页（采集步骤名称、上下文描述、参考材料）
- `ExpertOrganize.tsx` - 专家整理页（补充说明、添加素材）
- `Review.tsx` - 复核页面（左右分栏对照：左侧源输入，右侧数据契约）
- `Flowchart.tsx` - 流程图可视化

### 后端核心服务
- `app/services/ai_analysis.py` - AI 分析服务（核心，生成数据契约）
- `app/services/llm.py` - LLM 调用封装
- `app/routers/analysis.py` - AI 分析 API

### AI 分析流程
```
步骤 1 分析
  ↓ 输出变量传递
步骤 2 分析（接收 step1.outputs 作为上下文）
  ↓ 输出变量传递
步骤 N 分析
  ↓
完成，跳转复核页面
```

**关键特性**：上下文感知 - 确保变量名在步骤之间保持一致
- 步骤 1 输出 `office_image`
- 步骤 2 输入必须使用 `office_image`（而非另起名字）

## 数据模型

### 核心实体关系
```
Workflow (工作流)
  ├── Task[] (任务 - 二级结构)
  │     └── WorkflowStep[] (步骤)
  │           ├── StepNote[] (笔记/素材 - 三级结构)
  │           ├── Example[] (Few-Shot 样本)
  │           └── RoutingBranch[] (路由分支)
  └── WorkflowStep[] (兼容旧数据)
```

### Workflow 状态流
`draft` → `worker_done` → `expert_done` → `analyzed` → `confirmed` → `delivered`

## 环境配置

### 后端 (.env)
```bash
DATABASE_URL=postgresql+asyncpg://...
LLM_ENABLED=true
LLM_PROVIDER=chatglm          # 或 openai
LLM_API_BASE=http://localhost:8080/v1
LLM_API_KEY=your-api-key
LLM_MODEL=glm-4-flash
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760      # 10MB
```

### 前端 (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000
```

## API 文档
- Swagger UI: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json

## 前端类型生成
后端 OpenAPI 变更后，需重新生成前端 TypeScript 客户端：
```bash
cd frontend && npm run generate-api
```

## 全局规则
1. 使用简体中文回答问题和编写代码注释
2. 不要修改与任务非直接相关的代码
3. 涉及到内容编辑的地方，使用编辑工具修改而非文字说明
