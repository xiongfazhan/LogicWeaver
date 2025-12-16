# Design Document

## Overview

Universal SOP Architect 是一个前后端分离的 Web 应用，采用 React 前端 + Python FastAPI 后端 + PostgreSQL 数据库架构。系统核心是一个 4 步微循环 Wizard，将业务专家的经验采集为结构化 JSON 协议。

### 技术栈

#### Frontend (React)
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + Shadcn/UI
- **Icons:** Lucide React
- **Flowchart:** ReactFlow
- **State Management:** Zustand
- **HTTP Client:** Axios / TanStack Query

#### Backend (Python FastAPI)
- **Framework:** FastAPI
- **ORM:** SQLAlchemy 2.0
- **Database:** PostgreSQL
- **Migration:** Alembic
- **Validation:** Pydantic v2
- **File Storage:** Local filesystem / S3-compatible

#### Infrastructure
- **API Documentation:** OpenAPI (Swagger UI)
- **Authentication:** JWT (可选)
- **CORS:** FastAPI CORS middleware

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React + Vite)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Routes (React Router)                                                      │
│  ├── / (Dashboard)                                                          │
│  ├── /workflow/:id/builder (Builder Workspace)                              │
│  ├── /workflow/:id/review (Split Screen Review)                             │
│  └── /workflow/:id/flowchart (Visual Flowchart)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components                                                                 │
│  ├── Dashboard (WorkflowGrid, CreateModal)                                  │
│  ├── Builder (Sidebar, WizardCanvas, MicroStepCards)                        │
│  ├── Review (SourcePanel, ProtocolPanel)                                    │
│  └── Flowchart (FlowCanvas, StepNode, BranchEdge)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Store (Zustand)                     │  API Client (Axios/TanStack Query)   │
│  ├── workflowStore                   │  ├── workflowApi                     │
│  └── builderStore                    │  └── fileApi                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ HTTP/REST
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Backend (Python FastAPI)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  API Routers                                                                │
│  ├── /api/workflows (CRUD)                                                  │
│  ├── /api/workflows/{id}/steps (Step management)                            │
│  ├── /api/files/upload (File upload)                                        │
│  └── /api/protocol/{id} (Protocol JSON generation)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Services                            │  Schemas (Pydantic)                  │
│  ├── workflow_service                │  ├── WorkflowSchema                  │
│  ├── step_service                    │  ├── StepSchema                      │
│  ├── protocol_service                │  └── ProtocolSchema                  │
│  └── file_service                    │                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Models (SQLAlchemy)                 │  Repository Layer                    │
│  ├── Workflow                        │  ├── workflow_repository             │
│  ├── WorkflowStep                    │  ├── step_repository                 │
│  ├── Example                         │  └── example_repository              │
│  └── RoutingBranch                   │                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ SQLAlchemy
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PostgreSQL Database                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Tables: workflows, workflow_steps, examples, routing_branches              │
└─────────────────────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### Core Types

```typescript
// Workflow 核心类型
interface Workflow {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  status: 'draft' | 'deployed';
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStep {
  id: string;
  name: string;
  order: number;
  status: 'pending' | 'completed';
  context: ContextData;
  extraction: ExtractionData;
  logic: LogicData;
  routing: RoutingData;
}

// Micro-Step A: Context
interface ContextData {
  type: 'image' | 'text' | 'voice';
  imageUrl?: string;
  textContent?: string;
  voiceTranscript?: string;
  description: string;
}

// Micro-Step B: Extraction
interface ExtractionData {
  keywords: string[];
  voiceTranscript?: string;
}

// Micro-Step C: Logic
interface LogicData {
  strategy: 'rule_based' | 'few_shot';
  // Hard Rules
  ruleExpression?: string;
  // Few-Shot
  passingExamples?: Example[];
  failingExamples?: Example[];
  evaluationPrompt?: string;
}

interface Example {
  id: string;
  content: string; // URL for image, text for text
  type: 'image' | 'text';
  description?: string;
}

// Micro-Step D: Routing
interface RoutingData {
  defaultNext: string; // step_id or 'next'
  branches: RoutingBranch[];
}

interface RoutingBranch {
  id: string;
  conditionResult: string; // e.g., 'FAIL', 'UNSTABLE'
  actionType: string; // e.g., 'REJECT', 'ESCALATE'
  nextStepId: string; // step_id or 'end_process'
}
```


### Protocol JSON Output

```typescript
// 输出给 Agent 引擎的标准协议
interface ProtocolStep {
  step_id: string;
  step_name: string;
  business_domain: string;
  
  input_spec: {
    data_source: string;
    target_section: string;
    context_description: string;
  };
  
  logic_config: {
    logic_strategy: 'RULE_BASED' | 'SEMANTIC_SIMILARITY';
    rule_expression?: string;
    few_shot_examples?: {
      content: string;
      label: 'PASS' | 'FAIL';
      description: string;
    }[];
    evaluation_prompt?: string;
  };
  
  routing_map: {
    default_next: string;
    branches: {
      condition_result: string;
      action_type: string;
      next_step_id: string;
    }[];
  };
  
  output_schema: {
    fields: { name: string; type: string }[];
  };
}

interface ProtocolWorkflow {
  workflow_id: string;
  workflow_name: string;
  steps: ProtocolStep[];
}
```

### Component Interfaces

```typescript
// Store Interfaces
interface WorkflowStore {
  workflows: Workflow[];
  createWorkflow: (data: CreateWorkflowInput) => Workflow;
  updateWorkflow: (id: string, data: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  getWorkflow: (id: string) => Workflow | undefined;
}

interface BuilderStore {
  currentWorkflowId: string | null;
  currentStepIndex: number;
  currentMicroStep: 'context' | 'extraction' | 'logic' | 'routing';
  setCurrentStep: (index: number) => void;
  setMicroStep: (step: MicroStep) => void;
  updateStepData: (stepId: string, data: Partial<WorkflowStep>) => void;
}

// Service Interfaces
interface StorageService {
  saveWorkflow: (workflow: Workflow) => Promise<void>;
  loadWorkflows: () => Promise<Workflow[]>;
  saveImage: (file: File) => Promise<string>; // returns URL
  deleteImage: (url: string) => Promise<void>;
}

interface ProtocolService {
  generateProtocol: (workflow: Workflow) => ProtocolWorkflow;
  parseProtocol: (json: string) => ProtocolWorkflow;
  serializeWorkflow: (workflow: Workflow) => string;
  deserializeWorkflow: (json: string) => Workflow;
}
```


## Data Models

### PostgreSQL Database Schema

```sql
-- Workflows 表
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'deployed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Steps 表
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    step_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    
    -- Context (Micro-Step A)
    context_type VARCHAR(20) CHECK (context_type IN ('image', 'text', 'voice')),
    context_image_url VARCHAR(500),
    context_text_content TEXT,
    context_voice_transcript TEXT,
    context_description TEXT,
    
    -- Extraction (Micro-Step B)
    extraction_keywords TEXT[], -- PostgreSQL array
    extraction_voice_transcript TEXT,
    
    -- Logic (Micro-Step C)
    logic_strategy VARCHAR(20) CHECK (logic_strategy IN ('rule_based', 'few_shot')),
    logic_rule_expression TEXT,
    logic_evaluation_prompt TEXT,
    
    -- Routing (Micro-Step D)
    routing_default_next VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workflow_id, step_order)
);

-- Examples 表 (Few-Shot 样本)
CREATE TABLE examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- URL for image, text content for text
    content_type VARCHAR(20) CHECK (content_type IN ('image', 'text')),
    label VARCHAR(10) NOT NULL CHECK (label IN ('PASS', 'FAIL')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routing Branches 表
CREATE TABLE routing_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    condition_result VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    next_step_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_examples_step_id ON examples(step_id);
CREATE INDEX idx_routing_branches_step_id ON routing_branches(step_id);
```

### SQLAlchemy Models (Python)

```python
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, ARRAY, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    cover_image_url = Column(String(500))
    status = Column(String(20), default="draft")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    step_order = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    
    # Context
    context_type = Column(String(20))
    context_image_url = Column(String(500))
    context_text_content = Column(Text)
    context_voice_transcript = Column(Text)
    context_description = Column(Text)
    
    # Extraction
    extraction_keywords = Column(ARRAY(Text))
    extraction_voice_transcript = Column(Text)
    
    # Logic
    logic_strategy = Column(String(20))
    logic_rule_expression = Column(Text)
    logic_evaluation_prompt = Column(Text)
    
    # Routing
    routing_default_next = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    workflow = relationship("Workflow", back_populates="steps")
    examples = relationship("Example", back_populates="step", cascade="all, delete-orphan")
    routing_branches = relationship("RoutingBranch", back_populates="step", cascade="all, delete-orphan")

class Example(Base):
    __tablename__ = "examples"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    step_id = Column(UUID(as_uuid=True), ForeignKey("workflow_steps.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String(20))
    label = Column(String(10), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    step = relationship("WorkflowStep", back_populates="examples")

class RoutingBranch(Base):
    __tablename__ = "routing_branches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    step_id = Column(UUID(as_uuid=True), ForeignKey("workflow_steps.id", ondelete="CASCADE"), nullable=False)
    condition_result = Column(String(100), nullable=False)
    action_type = Column(String(100), nullable=False)
    next_step_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    step = relationship("WorkflowStep", back_populates="routing_branches")
```

### Frontend State Shape (Zustand)

```typescript
// Zustand Store Shape
interface AppState {
  // Workflow State (cached from API)
  workflows: Map<string, Workflow>;
  isLoading: boolean;
  error: string | null;
  
  // Builder State
  activeWorkflowId: string | null;
  activeStepIndex: number;
  activeMicroStep: MicroStep;
  isDirty: boolean;
}

type MicroStep = 'context' | 'extraction' | 'logic' | 'routing';
```

## UI/UX Design Specification

### Design System

- **Visual Style:** "Clean Industrial" (理性、克制、高对比度)
- **Color Palette:**
  - Background: `bg-slate-50` (App), `bg-white` (Card)
  - Primary Action: `bg-indigo-600`
  - Sidebar: `bg-slate-900` or `bg-white` with `border-r`
  - Success: `text-emerald-600`, `bg-emerald-50`, `border-emerald-200`
  - Active/Info: `text-indigo-600`, `bg-indigo-50`, `border-indigo-200`
  - Error: `text-rose-600`, `bg-rose-50`, `border-rose-200`
- **Typography:** Inter (System Sans-serif), Headers bold and tight

### Layout A: Dashboard (首页工作台)

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "My SOP Workflows"                    [User Avatar]│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  + Create   │  │ [Cover Img] │  │ [Cover Img] │          │
│  │    New      │  │  Title      │  │  Title      │          │
│  │  Workflow   │  │  Date|Badge │  │  Date|Badge │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  grid-cols-3, gap-4                                         │
└─────────────────────────────────────────────────────────────┘
```

- Create Card: `border-dashed`, Plus icon, "Create New Workflow"
- SOP Cards: Cover Image (top), Title, Last Edited, Status Badge (Draft/Deployed)

### Layout B: Workflow Setup Modal

- Component: Shadcn `Dialog`
- Fields: Name (required), Description (textarea), Cover Image (upload)
- Action: "Start Building" → redirect to Builder

### Layout C: Builder Workspace (核心采集器)

```
┌──────────────────┬──────────────────────────────────────────┐
│  Left Sidebar    │  Right Main Panel                        │
│  w-64, border-r  │  bg-slate-50                             │
│                  │                                          │
│  [Workflow Name] │  ┌────────────────────────────────────┐  │
│  ← Back          │  │ [A] → [B] → [C] → [D]  (Progress)  │  │
│                  │  └────────────────────────────────────┘  │
│  ○ Step 1 ✓      │                                          │
│  ● Step 2 (act)  │  ┌────────────────────────────────────┐  │
│  ○ Step 3        │  │                                    │  │
│  ○ Step 4        │  │     Wizard Card (max-w-2xl)        │  │
│                  │  │     (Context/Extract/Logic/Route)  │  │
│                  │  │                                    │  │
│  ──────────────  │  └────────────────────────────────────┘  │
│  [+ Add Step]    │                                          │
│                  │  ┌────────────────────────────────────┐  │
│                  │  │ [Previous]              [Next →]   │  │
│                  │  └────────────────────────────────────┘  │
└──────────────────┴──────────────────────────────────────────┘
```

- Sidebar Step States:
  - Completed: `CheckCircle` (green), text dimmed
  - Active: `CircleDot` (blue), `bg-indigo-50`, text bold
  - Future: `Circle` (gray), text muted

### Wizard Card: Step C (Logic Definition)

```
┌─────────────────────────────────────────────────────────────┐
│  [Hard Rules 📏]  |  [Experience/Few-Shot 🧠] ← Default     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ ✅ Passing Examples │  │ ❌ Failing Examples │          │
│  │ border-emerald-200  │  │ border-rose-200     │          │
│  │ bg-emerald-50/30    │  │ bg-rose-50/30       │          │
│  │                     │  │                     │          │
│  │  [Drop files here]  │  │  [Drop files here]  │          │
│  │                     │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│  grid-cols-2, gap-4                                         │
└─────────────────────────────────────────────────────────────┘
```

### Wizard Card: Step D (Routing Configuration)

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Default: Go to Next Step                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 If result is [FAIL]...                      [×]  │   │
│  │    → Action: [End Process]                          │   │
│  └─────────────────────────────────────────────────────┘   │
│  (left border colored red/orange)                          │
│                                                             │
│  [+ Add Condition Branch] (dashed button)                   │
└─────────────────────────────────────────────────────────────┘
```

### Layout D: Split Screen Review (双屏复核)

```
┌─────────────────────────────┬───────────────────────────────┐
│  Left Panel (Source)        │  Right Panel (AI Protocol)    │
│  bg-slate-100, p-6          │  bg-white, p-6, border-l      │
│                             │                               │
│  💬 Audio Transcript        │  ┌─────────────────────────┐  │
│  "如果像这几张图..."         │  │ Strategy: [Semantic]    │  │
│                             │  │ Rule: ...               │  │
│  📷 Uploaded Images         │  │ Routing:                │  │
│  [img1] [img2] [img3]       │  │  🔴 FAIL → End          │  │
│                             │  │  🟢 PASS → Step 3       │  │
│                             │  └─────────────────────────┘  │
├─────────────────────────────┴───────────────────────────────┤
│  [Generate Flowchart →]                    (Floating Footer)│
└─────────────────────────────────────────────────────────────┘
```

### Layout E: Visual Flowchart (ReactFlow)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│        ┌─────────────┐                                      │
│        │ [Thumbnail] │                                      │
│        │ Step 1      │                                      │
│        │ [✓ Done]    │                                      │
│        └──────┬──────┘                                      │
│               │ (green: Pass)                               │
│        ┌──────▼──────┐                                      │
│        │ [Thumbnail] │                                      │
│        │ Step 2      │──────────┐                           │
│        │ [● Active]  │          │ (red: Fail)               │
│        └──────┬──────┘          │                           │
│               │                 ▼                           │
│        ┌──────▼──────┐   ┌─────────────┐                    │
│        │ Step 3      │   │ End Process │                    │
│        └─────────────┘   └─────────────┘                    │
│                                                             │
│  Node: ~200px wide, Title + Thumbnail + Status Badge        │
│  Edge: Green (Pass), Red (Fail/Reject)                      │
└─────────────────────────────────────────────────────────────┘
```

## 工程实现注意事项

### 1. Enum 映射 (Logic Strategy Mapping)

数据库/前端使用的值与输出协议使用的值不同，需要在 `protocol_service.py` 中实现映射函数：

```python
# backend/app/services/protocol_service.py

# 内部存储值 -> 输出协议值
LOGIC_STRATEGY_MAPPING = {
    "rule_based": "RULE_BASED",
    "few_shot": "SEMANTIC_SIMILARITY",  # 关键映射！
}

# 输出协议值 -> 内部存储值 (反向映射)
LOGIC_STRATEGY_REVERSE_MAPPING = {v: k for k, v in LOGIC_STRATEGY_MAPPING.items()}

def map_logic_strategy_to_protocol(internal_value: str) -> str:
    """将内部存储的 logic_strategy 转换为协议输出格式"""
    return LOGIC_STRATEGY_MAPPING.get(internal_value, internal_value.upper())

def map_logic_strategy_from_protocol(protocol_value: str) -> str:
    """将协议格式的 logic_strategy 转换为内部存储格式"""
    return LOGIC_STRATEGY_REVERSE_MAPPING.get(protocol_value, protocol_value.lower())
```

### 2. 文件上传流 (File Upload & Static Files)

本地开发时需要配置 FastAPI 静态文件服务：

```python
# backend/app/main.py
from fastapi.staticfiles import StaticFiles
import os

# 创建上传目录
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 挂载静态文件服务
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 文件上传后返回的 URL 格式
# context_image_url = f"/uploads/{filename}"
# 前端访问: <img src="http://localhost:8000/uploads/xxx.jpg" />
```

### 3. 开发顺序 (API First 策略)

采用 API First 开发流程，确保前后端类型对齐：

```
1. 后端: 定义 Pydantic Schema
   ↓
2. 后端: 启动 FastAPI，访问 /docs 查看 OpenAPI
   ↓
3. 后端: 导出 openapi.json
   ↓
4. 前端: 使用 openapi-typescript-codegen 生成 TypeScript Client
   npx openapi-typescript-codegen --input http://localhost:8000/openapi.json --output ./src/api/generated
   ↓
5. 前端: 基于生成的类型开发 UI
```

## Error Handling

| Error Type | Handling Strategy |
|------------|-------------------|
| Storage Full | Display toast warning, suggest export |
| Image Upload Failed | Show error message, allow retry |
| Invalid JSON Parse | Display validation errors, highlight issues |
| Workflow Not Found | Redirect to dashboard with error toast |
| Step Navigation Error | Reset to first incomplete step |

### Error Response Format

```typescript
interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const ERROR_CODES = {
  STORAGE_FULL: 'STORAGE_FULL',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  PARSE_ERROR: 'PARSE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Workflow Serialization Round-Trip

*For any* valid Workflow object, serializing it to JSON and then deserializing back SHALL produce an equivalent Workflow object with identical structure and data.

**Validates: Requirements 7.4, 7.5**

### Property 2: Workflow Persistence Round-Trip

*For any* Workflow saved to storage, loading it back SHALL restore all steps, micro-step data, and routing configurations exactly as they were saved.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 3: Example Labeling Consistency

*For any* example uploaded to the passing zone, the stored example SHALL have label "PASS"; *for any* example uploaded to the failing zone, the stored example SHALL have label "FAIL".

**Validates: Requirements 4.4, 4.5**

### Property 4: Step Addition Invariant

*For any* workflow with N steps, clicking "Add New Step" SHALL result in a workflow with exactly N+1 steps, and the new step SHALL appear in the sidebar.

**Validates: Requirements 6.5**

### Property 5: Branch Removal Completeness

*For any* routing configuration with a branch, removing that branch SHALL result in the branch no longer existing in the routing_map.branches array.

**Validates: Requirements 5.4**

### Property 6: Protocol JSON Structure Completeness

*For any* completed workflow step, the generated Protocol JSON SHALL contain all required fields: input_spec, logic_config, routing_map, and output_schema.

**Validates: Requirements 7.1**

### Property 7: Few-Shot Examples Structure

*For any* logic configuration using Few-Shot mode, the generated logic_config SHALL include a few_shot_examples array where each example has content, label, and description fields.

**Validates: Requirements 7.2**

### Property 8: Routing Map Structure

*For any* routing configuration with branches, the generated routing_map SHALL include default_next and a branches array with condition_result, action_type, and next_step_id for each branch.

**Validates: Requirements 7.3**

### Property 9: Flowchart Node Completeness

*For any* workflow step rendered as a flowchart node, the node SHALL display the step title, thumbnail image (if present), and status badge.

**Validates: Requirements 9.1, 9.2**

### Property 10: Flowchart Edge Styling

*For any* edge in the flowchart, success paths SHALL be styled green with "Pass" label, and failure paths SHALL be styled red with "Fail/Reject" label.

**Validates: Requirements 9.3**

### Property 11: Step Navigation Consistency

*For any* step clicked in the sidebar, the Builder Workspace SHALL navigate to that step and display its current micro-step state.

**Validates: Requirements 6.2**

### Property 12: Workflow Card Display Completeness

*For any* workflow displayed as a card on the dashboard, the card SHALL show the cover image (if present), title, last edited date, and status badge.

**Validates: Requirements 1.4**


## Testing Strategy

### Testing Framework

#### Frontend (React)
- **Unit Testing:** Vitest
- **Property-Based Testing:** fast-check
- **Component Testing:** React Testing Library
- **E2E Testing:** Playwright (optional)

#### Backend (Python FastAPI)
- **Unit Testing:** pytest
- **Property-Based Testing:** Hypothesis
- **API Testing:** pytest + httpx (TestClient)
- **Database Testing:** pytest-asyncio + test database

### Dual Testing Approach

#### Unit Tests
- Test specific UI component rendering
- Test API endpoint responses
- Test edge cases (empty workflows, missing images)
- Test error handling paths
- Test individual utility functions

#### Property-Based Tests
- Each correctness property SHALL be implemented as a property-based test
- Frontend: fast-check, Backend: Hypothesis
- Each property test SHALL run a minimum of 100 iterations
- Each property test SHALL be tagged with format: `**Feature: universal-sop-architect, Property {number}: {property_text}**`

### Test File Organization

#### Frontend
```
frontend/src/
├── components/
│   └── __tests__/
│       ├── WorkflowCard.test.tsx
│       └── WizardCanvas.test.tsx
├── services/
│   └── __tests__/
│       ├── protocolService.test.ts
│       └── protocolService.property.test.ts
├── stores/
│   └── __tests__/
│       ├── workflowStore.test.ts
│       └── workflowStore.property.test.ts
└── lib/
    └── __tests__/
        └── generators.ts  # fast-check generators
```

#### Backend
```
backend/
├── tests/
│   ├── conftest.py           # pytest fixtures
│   ├── test_workflows.py     # API tests
│   ├── test_protocol.py      # Protocol generation tests
│   ├── property/
│   │   ├── test_serialization.py  # Hypothesis tests
│   │   └── strategies.py          # Hypothesis strategies
│   └── factories.py          # Test data factories
```

### Generator Strategy

#### Frontend (fast-check)
```typescript
import * as fc from 'fast-check';

const workflowArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 500 }),
  status: fc.constantFrom('draft', 'deployed'),
  steps: fc.array(stepArb, { minLength: 0, maxLength: 20 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

const exampleArb = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1 }),
  type: fc.constantFrom('image', 'text'),
  description: fc.option(fc.string()),
});
```

#### Backend (Hypothesis)
```python
from hypothesis import strategies as st

workflow_strategy = st.fixed_dictionaries({
    "id": st.uuids(),
    "name": st.text(min_size=1, max_size=100),
    "description": st.text(max_size=500),
    "status": st.sampled_from(["draft", "deployed"]),
    "steps": st.lists(step_strategy, max_size=20),
})

example_strategy = st.fixed_dictionaries({
    "id": st.uuids(),
    "content": st.text(min_size=1),
    "content_type": st.sampled_from(["image", "text"]),
    "label": st.sampled_from(["PASS", "FAIL"]),
    "description": st.text() | st.none(),
})

routing_branch_strategy = st.fixed_dictionaries({
    "id": st.uuids(),
    "condition_result": st.text(min_size=1),
    "action_type": st.text(min_size=1),
    "next_step_id": st.text(min_size=1),
})
```
