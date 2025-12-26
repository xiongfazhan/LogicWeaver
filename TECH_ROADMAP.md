# LogicWeaver 技术路线文档

## 1. 项目概述

**LogicWeaver** 是一个业务逻辑构建平台，核心价值在于通过 AI 将业务专家的自然语言描述转化为结构化的数据契约（Data Flow Specification），实现"教-译-筑"三阶解耦。

| 角色 | 职责 | 输入/输出 |
|------|------|----------|
| 上游：业务专家 | 只负责"教" | 自然语言 + 图片/语音 |
| 中游：LogicWeaver | 负责"译" | Data Flow Specification |
| 下游：开发人员 | 负责"筑" | 自由选择技术实现 |

---

## 2. 整体技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  Vite Dev Server (localhost:5173)                           │
│  ├── Pages: Dashboard/WorkerCollect/ExpertOrganize/Review   │
│  ├── Components: UI组件 + 业务组件                           │
│  ├── Stores: Zustand (全局状态)                             │
│  └── Hooks: React Query (服务器状态)                        │
└─────────────────────────────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  Uvicorn Server (localhost:8000)                            │
│  ├── Routers (11个API路由)                                   │
│  ├── Services (AI分析核心 + LLM封装)                         │
│  ├── Repositories (数据访问层)                               │
│  └── Models (SQLAlchemy ORM)                                │
└─────────────────────────────────────────────────────────────┘
                         │ SQLAlchemy asyncpg
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  Tables: workflows, tasks, workflow_steps, step_notes,       │
│          examples, routing_branches                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 前端技术路线

### 3.1 核心技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.6.2 | 类型安全 |
| Vite | 6.0.1 | 构建工具（快速热更新） |
| React Router | 6.28.0 | 路由管理 |
| Tailwind CSS | 3.4.16 | 样式框架 |
| Shadcn/UI | Latest | 无样式组件库 |
| @xyflow/react | 12.3.6 | 流程图可视化 |
| Zustand | 5.0.2 | 全局状态管理 |
| @tanstack/react-query | 5.62.0 | 服务器状态管理 |
| Axios | 1.7.8 | HTTP 客户端 |

### 3.2 页面结构

```
/                          → Dashboard（工作流列表）
/workflow/:id/worker       → WorkerCollect（工人采集页）
/workflow/:id/expert       → ExpertOrganize（专家整理页）
/workflow/:id/review       → Review（AI分析 + 复核）
/workflow/:id/flowchart    → Flowchart（流程图可视化）
```

### 3.3 组件架构

```
src/
├── pages/              # 5个主页面
├── components/
│   ├── builder/       # 采集页组件（步骤表单、素材上传）
│   ├── review/        # 复核页组件（左右分栏对照）
│   ├── flowchart/     # 流程图组件（节点设计）
│   ├── dashboard/     # 仪表盘组件（工作流卡片）
│   └── ui/            # Shadcn/UI 基础组件
├── hooks/             # 自定义 Hooks（8个）
├── stores/            # Zustand 状态管理
├── api/               # API 客户端（OpenAPI自动生成）
├── types/             # TypeScript 类型定义
└── lib/               # 工具函数
```

### 3.4 状态管理策略

| 状态类型 | 方案 | 用途 |
|----------|------|------|
| 全局状态 | Zustand | 工作流编辑状态、步骤数据 |
| 服务器状态 | React Query | API 缓存、自动重新验证 |
| 本地状态 | useState | 组件内部状态 |

### 3.5 前端开发工作流

```bash
# 开发
npm run dev                    # 启动 Vite 开发服务器（localhost:5173）

# 构建
npm run build                  # TypeScript 编译 + Vite 构建

# 代码质量
npm run lint                   # ESLint 检查

# 测试
npm run test                   # Vitest 运行测试

# API 客户端生成
npm run generate-api           # 从后端 OpenAPI 生成 TypeScript 类型
```

---

## 4. 后端技术路线

### 4.1 核心技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| FastAPI | Latest | Web 框架（异步支持） |
| Python | 3.11+ | 运行时 |
| SQLAlchemy | 2.0.0 | ORM（异步） |
| asyncpg | Latest | PostgreSQL 异步驱动 |
| Alembic | 1.13.0 | 数据库迁移 |
| Pydantic | 2.5.0 | 数据验证 |
| OpenAI SDK | 1.12.0 | LLM 集成（兼容多种模型） |
| pytest | Latest | 测试框架 |

### 4.2 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│  Router 层 (app/routers/)                                   │
│  11个路由器：workflow, step, analysis, file, protocol, ...  │
│  职责：HTTP 请求处理、参数验证、响应封装                     │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Service 层 (app/services/)                                 │
│  - AIAnalysisService: 数据契约生成核心                       │
│  - LLMService: LLM 调用封装                                  │
│  职责：业务逻辑、LLM 调用、上下文管理                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Repository 层 (app/repositories/)                          │
│  - WorkflowRepository, StepRepository                       │
│  职责：数据库 CRUD 操作封装                                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Model 层 (app/models/)                                     │
│  - Workflow, Task, WorkflowStep, StepNote, Example          │
│  职责：数据模型定义、ORM 映射                                │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 API 路由设计

| 路由 | 用途 |
|------|------|
| `/api/workflows` | 工作流 CRUD |
| `/api/steps` | 步骤 CRUD |
| `/api/tasks` | 任务 CRUD |
| `/api/analysis` | AI 分析接口 |
| `/api/files` | 文件上传 |
| `/api/protocol` | 协议管理 |
| `/api/notes` | 笔记/素材管理 |
| `/api/templates` | 模板管理 |
| `/api/status` | 状态管理 |

### 4.4 核心服务：AIAnalysisService

**职责**：将业务需求翻译成 Data Flow Specification

```python
class StepContract(BaseModel):
    step_id: int                      # 步骤序号
    step_name: str                    # 步骤名称
    business_intent: str              # 业务意图
    inputs: list[DataField]           # 输入数据契约
    outputs: list[DataField]          # 输出数据契约
    acceptance_criteria: Optional[str] # 验收标准
```

**上下文感知分析**：
- 步骤 1 分析 → 输出变量
- 步骤 2 分析（接收步骤 1 的 outputs 作为上下文）
- 步骤 N 分析（接收前序所有步骤的 outputs）

### 4.5 后端开发工作流

```bash
# 启动开发服务器
uvicorn app.main:app --reload     # localhost:8000

# 数据库迁移
alembic upgrade head              # 应用迁移
alembic revision --autogenerate -m "描述"  # 创建新迁移

# 测试
pytest                            # 运行所有测试
pytest -v                         # 详细输出
pytest tests/test_analysis_api.py # 运行特定测试

# 代码质量
ruff check .                      # Linter 检查
```

---

## 5. 数据库设计

### 5.1 技术选型
- **数据库**：PostgreSQL 15
- **驱动**：asyncpg（异步）
- **ORM**：SQLAlchemy 2.0
- **迁移**：Alembic

### 5.2 核心数据模型

```
Workflow (工作流)
  ├── id: UUID (主键)
  ├── name: str (工作流名称)
  ├── status: enum (draft → worker_done → expert_done → analyzed → confirmed → delivered)
  ├── is_template: bool (是否模板)
  └── template_id: UUID (模板引用)

Task (任务 - 二级结构)
  ├── id: UUID
  ├── workflow_id: UUID (外键)
  ├── name: str
  └── WorkflowStep[] (步骤列表)

WorkflowStep (步骤)
  ├── id: UUID
  ├── task_id: UUID (外键，可选)
  ├── workflow_id: UUID (外键)
  ├── name: str (步骤名称)
  ├── context_description: str (上下文描述)
  ├── expert_notes: str (专家整理备注)
  ├── 4个微步骤字段: context/extraction/logic/routing
  └── status: enum (pending/completed)

StepNote (笔记/素材 - 三级结构)
  ├── id: UUID
  ├── step_id: UUID (外键)
  ├── content_type: enum (image/voice/video/text)
  ├── content: str (内容)
  ├── voice_transcript: str (语音转文字)
  └── created_by: enum (worker/expert)

Example (Few-Shot 样本)
  ├── id: UUID
  ├── step_id: UUID (外键)
  ├── input_data: JSON
  └── expected_output: JSON

RoutingBranch (路由分支)
  ├── id: UUID
  ├── step_id: UUID (外键)
  ├── condition: str (条件表达式)
  └── target_step_id: UUID (目标步骤)
```

### 5.3 数据库服务

```bash
# 启动 PostgreSQL
docker-compose up -d

# 连接信息
Host: localhost
Port: 5432
Database: logicweaver
User: postgres
Password: (见 .env)
```

---

## 6. AI/LLM 集成方案

### 6.1 LLM 服务封装

**支持的模型**：
- ChatGLM（智谱 AI）
- GPT-4 / GPT-3.5（OpenAI）
- 任何 OpenAI 兼容的 API

**配置方式**：
```bash
LLM_ENABLED=true
LLM_PROVIDER=chatglm          # 或 openai
LLM_API_BASE=http://localhost:8080/v1
LLM_API_KEY=your-api-key
LLM_MODEL=glm-4-flash
```

### 6.2 数据契约生成 Prompt

**角色定义**：数据契约定义者

**核心原则**：
> 你只定义"要什么"，不管"怎么做"。

**输出格式**：
```json
{
  "contract": {
    "step_id": 1,
    "step_name": "步骤中文名",
    "business_intent": "业务意图（一句话）",
    "inputs": [{"name": "...", "type": "...", "description": "..."}],
    "outputs": [{"name": "...", "type": "...", "description": "..."}],
    "acceptance_criteria": "验收标准"
  },
  "confidence_score": 0.9
}
```

### 6.3 上下文传递机制

```python
def analyze_step(step_id, previous_outputs):
    """
    previous_outputs 格式:
    [
      {"name": "office_image", "type": "image", "description": "办公室照片"},
      {"name": "person_count", "type": "int", "description": "人数"}
    ]
    """
    # 将前序输出作为上下文传递给 LLM
    # LLM 在定义 inputs 时会使用这些变量名
```

---

## 7. 开发工作流

### 7.1 完整开发流程

```bash
# 1. 启动基础设施
docker-compose up -d               # PostgreSQL

# 2. 后端启动
cd backend
pip install -r requirements.txt
alembic upgrade head               # 应用数据库迁移
uvicorn app.main:app --reload      # 启动 API 服务器

# 3. 前端启动
cd frontend
npm install
npm run dev                        # 启动 Vite 开发服务器

# 4. 访问
# 前端: http://localhost:5173
# API 文档: http://localhost:8000/docs
# OpenAPI: http://localhost:8000/openapi.json

# 5. 后端 API 变更后
# 更新前端类型
cd frontend && npm run generate-api
```

### 7.2 根目录脚本

```json
{
  "frontend:dev": "npm run dev --workspace=frontend",
  "frontend:build": "npm run build --workspace=frontend",
  "backend:dev": "cd backend && uvicorn app.main:app --reload",
  "backend:test": "cd backend && pytest"
}
```

---

## 8. 部署方案

### 8.1 生产环境建议

**前端**：
- 构建静态文件：`npm run build`
- 部署到 CDN 或 Nginx

**后端**：
- 使用 Gunicorn + Uvicorn Workers
- 配置 HTTPS（Let's Encrypt）
- 设置环境变量（生产数据库、LLM API 密钥）

**数据库**：
- 托管 PostgreSQL（如 AWS RDS、Supabase）

### 8.2 环境变量清单

**后端**：
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
DATABASE_URL_SYNC=postgresql://user:pass@host/db
LLM_ENABLED=true
LLM_PROVIDER=chatglm
LLM_API_BASE=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=your-api-key
LLM_MODEL=glm-4
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760
CORS_ORIGINS=["https://yourdomain.com"]
```

**前端**：
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## 9. 技术亮点

1. **OpenAPI 自动生成**：前端 TypeScript 类型从后端 OpenAPI 自动生成，保证前后端类型一致
2. **上下文感知的 AI 分析**：步骤间变量自动传递，确保数据流一致性
3. **异步优先**：SQLAlchemy asyncpg 驱动，全异步数据库操作
4. **分层架构**：Router → Service → Repository → Model 清晰分层
5. **状态管理分离**：Zustand（全局）+ React Query（服务器）
6. **属性测试**：使用 Hypothesis 进行基于属性的测试

---

## 10. 未来扩展方向

### 10.1 功能扩展
- [ ] 工作流版本控制
- [ ] 协作编辑（多人同时编辑）
- [ ] 更多 LLM 模型支持
- [ ] 工作流执行引擎

### 10.2 技术优化
- [ ] 前端迁移到 Next.js（SSR）
- [ ] 后端添加 Redis 缓存
- [ ] 消息队列（Celery/RQ）处理异步任务
- [ ] WebSocket 实时更新

---

## 11. 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v1.0 | - | 初版，4步微循环采集 |
| v2.0 | - | 增加 Few-Shot 软规则、路由分支 |
| v3.0 | 2024-12 | **范式转变**：从"技术指令"到"数据契约" |
