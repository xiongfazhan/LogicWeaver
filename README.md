# Universal SOP Architect (通用 AI Agent 业务灵魂构建平台)

专家经验数字化编译器 —— 将人类的"直觉"与"流程"编译为 AI 可执行的代码。

## 项目简介

本平台旨在帮助业务专家（老师傅、资深法务、金牌客服等）将其专业经验转化为 AI Agent 可执行的标准操作流程（SOP）。

## 核心功能

### 采集端 - "万能业务切片机"
通过 4 步微循环（Wizard UI）采集业务流程：
- **步骤 A：锁定对象 (Context)** - 确定注意力焦点
- **步骤 B：提取信息 (Extraction)** - 提取关键信息
- **步骤 C：判断逻辑 (Logic)** - 支持硬规则和软规则（Few-Shot）
- **步骤 D：执行路由 (Routing)** - 配置条件跳转逻辑

**Builder 工作区组件：**
- **Sidebar** - 左侧步骤导航栏，显示工作流步骤列表，支持步骤切换和添加新步骤
- **WizardCanvas** - 右侧主画布，展示当前微步骤的采集界面
- **MicroStepProgress** - 微步骤进度指示器
- **ContextCard** - 上下文采集卡片（Micro-Step A），支持三种输入模式：
  - 📷 图片/截图上传 - 上传需要 AI 关注的文档截图或图片
  - 📝 文本选择 - 输入或粘贴文本内容
  - 🎤 语音描述 - 输入语音转录文本
  - 支持上下文描述字段，帮助 AI 理解业务含义

### 产出端 - "通用开发协议"
生成标准化 JSON 数据包，包含：
- 输入规格 (input_spec)
- 处理逻辑 (logic_config) - 支持语义相似度/小样本学习
- 路由映射 (routing_map)
- 输出结构 (output_schema)

#### File Upload API
文件上传服务支持图片文件的上传和管理。

**上传文件**
```
POST /api/files/upload
Content-Type: multipart/form-data
```

支持的文件格式：JPG, JPEG, PNG, GIF, WEBP, BMP  
最大文件大小：10MB（可通过 `MAX_UPLOAD_SIZE` 环境变量配置）

响应示例：
```json
{
  "url": "/uploads/20241216_143052_a1b2c3d4.jpg",
  "filename": "original_name.jpg",
  "message": "File uploaded successfully"
}
```

**删除文件**
```
DELETE /api/files/delete
Content-Type: application/json

{
  "url": "/uploads/20241216_143052_a1b2c3d4.jpg"
}
```

#### Protocol API
通过 `GET /api/protocol/{workflow_id}` 端点获取 Protocol JSON：

```json
{
  "workflow_id": "uuid",
  "workflow_name": "质检流程",
  "steps": [
    {
      "step_id": "uuid",
      "step_name": "外观检查",
      "business_domain": "quality_check",
      "input_spec": {
        "data_source": "image",
        "target_section": "/uploads/context.jpg",
        "context_description": "检查产品外观 [Keywords: 划痕, 变形]"
      },
      "logic_config": {
        "logic_strategy": "SEMANTIC_SIMILARITY",
        "few_shot_examples": [
          {"content": "...", "label": "PASS", "description": "合格样本"}
        ],
        "evaluation_prompt": "根据示例判断产品外观是否合格"
      },
      "routing_map": {
        "default_next": "step_2",
        "branches": [
          {"condition_result": "FAIL", "action_type": "REJECT", "next_step_id": "end"}
        ]
      },
      "output_schema": {
        "fields": [{"name": "judgment_result", "type": "string"}]
      }
    }
  ]
}
```

**Logic Strategy 映射：**
| 内部存储值 | Protocol 输出值 |
|-----------|----------------|
| `rule_based` | `RULE_BASED` |
| `few_shot` | `SEMANTIC_SIMILARITY` |

### 复核端 - "双屏确认 + 状态机视图"
- 左文右译界面 (Split Screen)
- 全景流程图 (State Machine View)

**Review 页面组件：**
- **SourcePanel** - 左侧源输入面板，展示工作流各步骤的原始采集数据：
  - 📷 上下文数据 (Context) - 显示图片预览、文本内容、语音转录
  - 📝 提取数据 (Extraction) - 显示关键词标签和语音转录
  - ✅/❌ Few-Shot 样本 - 分栏展示通过样本和失败样本
  - 支持步骤状态徽章（已完成/进行中）
- **ProtocolPanel** - 右侧 AI 协议面板，展示生成的 Protocol JSON

**Flowchart 流程图组件：**
基于 ReactFlow (@xyflow/react) 实现的可视化流程图模块，用于展示工作流的状态机视图。

- **FlowCanvas** - ReactFlow 画布容器，配置自定义节点和边类型，支持缩放、平移、小地图导航
- **StepNode** - 步骤节点组件，富卡片样式，包含：
  - 步骤标题和顺序编号
  - 缩略图预览（如有上下文图片）
  - 状态徽章（Completed/Pending）
  - 结束节点特殊样式
- **BranchEdge** - 分支边组件，根据路由类型显示不同颜色：
  - 🟢 成功路径 (Pass) - 绿色
  - 🔴 失败路径 (Fail) - 红色
- **workflowToFlowchart** - 工具函数，将 WorkflowResponse 转换为 ReactFlow 节点和边
- **类型定义** - `FlowchartNode`, `FlowchartEdge`, `StepNodeData`, `BranchEdgeData`

```typescript
// 使用示例
import { FlowCanvas, workflowToFlowchart } from '@/components/flowchart';

// 直接使用画布组件
<FlowCanvas workflow={workflowData} className="w-full h-full" />

// 或手动转换数据
const { nodes, edges } = workflowToFlowchart(workflowData);
```

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### 1. 克隆项目并安装依赖

```bash
git clone <repository-url>
cd universal-sop-architect

# 安装前端依赖
npm install

# 安装后端依赖
cd backend
pip install -r requirements.txt
cd ..
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
cp frontend/.env.example frontend/.env
```

编辑 `.env` 文件，配置以下变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 异步连接 URL | `postgresql+asyncpg://user:pass@localhost:5432/sop_architect` |
| `DATABASE_URL_SYNC` | PostgreSQL 同步连接 URL | `postgresql://user:pass@localhost:5432/sop_architect` |
| `BACKEND_HOST` | 后端监听地址 | `0.0.0.0` |
| `BACKEND_PORT` | 后端监听端口 | `8000` |
| `DEBUG` | 调试模式 | `true` |
| `UPLOAD_DIR` | 文件上传目录 | `uploads` |
| `MAX_UPLOAD_SIZE` | 最大上传文件大小 (bytes) | `10485760` (10MB) |

### 3. 初始化数据库

```bash
cd backend
alembic upgrade head
cd ..
```

### 4. 启动服务

```bash
# 终端 1：启动后端
npm run backend:dev
# 后端运行在 http://localhost:8000
# API 文档：http://localhost:8000/docs

# 终端 2：启动前端
npm run frontend:dev
# 前端运行在 http://localhost:5173
```

### 5. 开始使用

1. 打开浏览器访问 `http://localhost:5173`
2. 点击 "创建新工作流" 卡片
3. 输入工作流名称和描述，可选上传封面图
4. 进入 Builder Workspace，按照 4 步微循环采集业务逻辑：
   - **Context** - 上传图片/输入文本/语音描述
   - **Extraction** - 定义要提取的关键词
   - **Logic** - 选择硬规则或 Few-Shot 模式
   - **Routing** - 配置条件分支和跳转
5. 完成后进入 Review 页面查看双屏对比
6. 点击 "生成流程图" 查看可视化状态机

## 技术栈

### 前端
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **State Management:** Zustand
- **Data Fetching:** TanStack Query + Axios
- **API Client:** OpenAPI 生成的类型安全客户端
- **Icons:** Lucide React
- **Flowchart:** ReactFlow (@xyflow/react)
- **Testing:** Vitest + React Testing Library + fast-check

### 后端
- **Framework:** FastAPI (Python)
- **ORM:** SQLAlchemy 2.0
- **Database:** PostgreSQL
- **Migration:** Alembic
- **Testing:** pytest + Hypothesis (属性测试)

### 设计风格
- **Visual Style:** Clean Industrial (理性、克制、高对比度)

## 开发

本项目采用 npm workspaces 管理 monorepo 结构。

```bash
# 安装所有依赖
npm install

# 前端开发
npm run frontend:dev      # 启动前端开发服务器
npm run frontend:build    # 构建前端生产版本
npm run frontend:test     # 运行前端测试

# 后端开发
npm run backend:dev       # 启动后端开发服务器 (uvicorn --reload)
npm run backend:test      # 运行后端测试 (pytest)

# 或直接在 backend 目录运行测试
cd backend
pytest                    # 测试配置已自动处理模块路径
pytest tests/property/    # 运行属性测试 (Hypothesis)
```

### 属性测试 (Property-based Testing)

后端使用 [Hypothesis](https://hypothesis.readthedocs.io/) 进行属性测试，位于 `backend/tests/property/` 目录。

**测试内容：**

| 属性 | 测试文件 | 验证需求 | 说明 |
|------|----------|----------|------|
| Workflow Persistence Round-Trip | `test_workflow_persistence.py` | - | 验证工作流保存后重新加载能完整恢复所有数据 |
| Step Addition Invariant | `test_step_addition.py` | 6.5 | 验证添加步骤后工作流步骤数正确增加 |
| Example Labeling Consistency | `test_example_labeling.py` | 4.4, 4.5 | 验证样本标签（PASS/FAIL）存储一致性 |
| Branch Removal Invariant | `test_branch_removal.py` | - | 验证删除路由分支后数据一致性 |
| Protocol JSON Structure Completeness | `test_protocol_structure.py` | 7.1 | 验证生成的 Protocol JSON 包含所有必需字段 |
| Few-Shot Examples Structure | `test_few_shot_structure.py` | 7.2 | 验证 Few-Shot 样本数组包含 content、label、description 字段 |
| Routing Map Structure | `test_routing_map_structure.py` | 7.3 | 验证 routing_map 包含 default_next 和 branches 数组结构 |

**Property 3: Example Labeling Consistency (样本标签一致性)**

验证需求 4.4, 4.5：上传到通过区的样本必须标记为 "PASS"，上传到失败区的样本必须标记为 "FAIL"。

测试场景：
- 通过区上传：验证样本标签为 PASS
- 失败区上传：验证样本标签为 FAIL
- 标签持久化：验证标签在存储后正确保留，并能通过过滤方法正确检索

```python
# 测试示例
@given(content=example_content_strategy, label=st.sampled_from(["PASS", "FAIL"]))
def test_label_preserved_after_storage(content, label):
    # 创建样本
    example = service.create_example(step_id, ExampleCreate(content=content, label=label))
    # 验证：存储的标签与输入一致
    assert example.label == label
    # 验证：从数据库加载后标签仍然正确
    loaded = service.get_example(example.id)
    assert loaded.label == label
```

**Property 4: Step Addition Invariant (步骤添加不变量)**

验证需求 6.5：对于任何包含 N 个步骤的工作流，添加新步骤后必须恰好有 N+1 个步骤。

测试场景：
- 单次添加步骤：验证步骤数从 N 变为 N+1
- 多次连续添加：验证每次添加后步骤数都正确递增

```python
# 测试示例
@given(workflow=workflow_data(min_steps=0, max_steps=5))
def test_step_addition_increases_count_by_one(workflow):
    # 初始步骤数 N
    initial_count = len(workflow.steps)
    # 添加新步骤
    step_service.create_step_auto_order(workflow_id, new_step_data)
    # 验证：最终步骤数 == N + 1
    assert len(updated_workflow.steps) == initial_count + 1
```

**Property 6: Protocol JSON Structure Completeness (Protocol JSON 结构完整性)**

验证需求 7.1：对于任何已完成的工作流步骤，生成的 Protocol JSON 必须包含所有必需字段：`input_spec`、`logic_config`、`routing_map` 和 `output_schema`。

测试场景：
- 工作流级别字段：验证 `workflow_id`、`workflow_name`、`steps` 存在
- 步骤级别字段：验证每个步骤包含 `step_id`、`step_name`、`business_domain`
- 必需子结构：验证 `input_spec`、`logic_config`、`routing_map`、`output_schema` 存在且类型正确
- 字段值验证：验证 `logic_strategy` 为有效枚举值（`RULE_BASED` 或 `SEMANTIC_SIMILARITY`）

```python
# 测试示例
@given(data=workflow_data(min_steps=1, max_steps=5))
def test_protocol_json_structure_completeness(data):
    # 创建工作流并生成 Protocol
    protocol = protocol_service.generate_protocol(workflow_id)
    
    # 验证：Protocol 包含所有必需的顶级字段
    assert protocol.workflow_id is not None
    assert protocol.workflow_name is not None
    assert protocol.steps is not None
    
    # 验证：每个步骤包含所有必需字段
    for step in protocol.steps:
        assert step.input_spec is not None
        assert step.logic_config is not None
        assert step.routing_map is not None
        assert step.output_schema is not None
        assert step.logic_config.logic_strategy in ["RULE_BASED", "SEMANTIC_SIMILARITY"]
```

**Property 7: Few-Shot Examples Structure (Few-Shot 样本结构)**

验证需求 7.2：对于任何使用 Few-Shot 模式的逻辑配置，生成的 `logic_config` 必须包含 `few_shot_examples` 数组，且每个样本必须包含 `content`、`label` 和 `description` 字段。

测试场景：
- 样本数组存在性：验证使用 few_shot 策略且有样本的步骤包含 `few_shot_examples`
- 字段完整性：验证每个样本包含 `content`（字符串）、`label`（PASS/FAIL）、`description`（字符串）
- 样本数量一致性：验证生成的样本数量与原始数据一致

```python
# 测试示例
@given(data=workflow_data(min_steps=1, max_steps=5))
def test_few_shot_examples_structure(data):
    # 创建工作流并生成 Protocol
    protocol = protocol_service.generate_protocol(workflow_id)
    
    for step in protocol.steps:
        if step.logic_config.logic_strategy == "SEMANTIC_SIMILARITY":
            # 验证：few_shot_examples 存在
            assert step.logic_config.few_shot_examples is not None
            
            # 验证：每个样本包含必需字段
            for example in step.logic_config.few_shot_examples:
                assert example.content is not None
                assert example.label in ["PASS", "FAIL"]
                assert example.description is not None
```

**Property 8: Routing Map Structure (路由映射结构)**

验证需求 7.3：对于任何包含路由分支的配置，生成的 `routing_map` 必须包含 `default_next` 和 `branches` 数组，且每个分支必须包含 `condition_result`、`action_type` 和 `next_step_id` 字段。

测试场景：
- 结构完整性：验证 `routing_map` 包含 `default_next`（非空字符串）和 `branches`（列表）
- 分支字段验证：验证每个分支包含 `condition_result`、`action_type`、`next_step_id`（均为非空字符串）
- 分支数量一致性：验证生成的分支数量与输入数据一致

```python
# 测试示例
@given(data=workflow_data(min_steps=1, max_steps=5))
def test_routing_map_structure(data):
    # 创建工作流并生成 Protocol
    protocol = protocol_service.generate_protocol(workflow_id)
    
    for step in protocol.steps:
        routing_map = step.routing_map
        
        # 验证：routing_map 包含必需字段
        assert routing_map.default_next is not None
        assert isinstance(routing_map.default_next, str)
        assert len(routing_map.default_next) > 0
        assert routing_map.branches is not None
        assert isinstance(routing_map.branches, list)
        
        # 验证：每个分支包含必需字段
        for branch in routing_map.branches:
            assert branch.condition_result is not None
            assert branch.action_type is not None
            assert branch.next_step_id is not None
```

**策略生成器 (`strategies.py`)：**
- `workflow_data()` - 生成完整的工作流测试数据
- `workflow_step_data()` - 生成步骤数据
- `example_data()` - 生成 Few-Shot 样本数据
- `routing_branch_data()` - 生成路由分支数据
- `name_strategy` - 生成有效的名称字符串

```bash
# 运行属性测试
pytest backend/tests/property/ -v

# 运行特定属性测试
pytest backend/tests/property/test_step_addition.py -v

# 运行更多测试用例
pytest backend/tests/property/ --hypothesis-seed=random -v
```

### 前端属性测试 (Property-based Testing)

前端使用 [fast-check](https://fast-check.dev/) 进行属性测试，位于各组件目录下的 `*.property.test.tsx` 文件。

**测试内容：**

| 属性 | 测试文件 | 验证需求 | 说明 |
|------|----------|----------|------|
| Flowchart Node Completeness | `StepNode.property.test.tsx` | 9.1, 9.2 | 验证流程图节点显示标题、缩略图、状态徽章 |
| Flowchart Edge Styling | `BranchEdge.property.test.tsx` | 9.3 | 验证流程图边样式：成功路径绿色、失败路径红色 |
| Step Navigation Consistency | `Sidebar.property.test.tsx` | 6.2 | 验证侧边栏步骤导航正确更新状态 |
| Workflow Card Display Completeness | `WorkflowCard.property.test.tsx` | 1.4 | 验证工作流卡片显示封面图、标题、日期、状态徽章 |

**Property 9: Flowchart Node Completeness (流程图节点完整性)**

验证需求 9.1, 9.2：对于任意 WorkflowStep 渲染为流程图节点，节点应显示步骤标题、缩略图（如果存在）和状态徽章。

测试场景：
- 标题显示：验证任意步骤节点的标题正确显示
- 缩略图显示：验证有缩略图时正确显示图片（src 和 alt 属性）
- 占位符显示：验证无缩略图时显示步骤顺序号作为占位符
- 状态徽章：验证 Completed/Pending 状态徽章正确显示
- 结束节点：验证结束节点正确渲染标题且不显示缩略图

```typescript
// 测试示例
import * as fc from 'fast-check';

// 生成随机 StepNodeData 对象
const stepNodeDataArb = fc.record({
  title: fc.stringMatching(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,30}$/),
  thumbnailUrl: fc.option(fc.constant('https://example.com/thumbnail.jpg'), { nil: null }),
  status: fc.constantFrom('pending', 'completed'),
  order: fc.integer({ min: 1, max: 100 }),
  isEndNode: fc.constant(false),
});

// 属性测试：验证所有必需元素同时显示
fc.assert(
  fc.property(stepNodeDataArb, (data) => {
    const { container } = render(<ReactFlowProvider><StepNode data={data} /></ReactFlowProvider>);
    
    // 验证标题
    expect(container.textContent).toContain(data.title);
    
    // 验证状态徽章
    const expectedStatusText = data.status === 'completed' ? 'Completed' : 'Pending';
    expect(within(container).getByText(expectedStatusText)).toBeInTheDocument();
  }),
  { numRuns: 100 }
);
```

**Property 10: Flowchart Edge Styling (流程图边样式)**

验证需求 9.3：对于任意流程图边，成功路径应为绿色样式，失败路径应为红色样式。

测试场景：
- 成功路径颜色：验证 pass 类型边使用绿色描边 (#10b981)
- 失败路径颜色：验证 fail 类型边使用红色描边 (#ef4444)
- 样式一致性：验证边类型与颜色的对应关系始终一致
- 描边宽度：验证所有边的描边宽度一致 (stroke-width: 2)

```typescript
// 测试示例
import * as fc from 'fast-check';

// 生成随机 BranchEdgeData 对象
const passEdgeDataArb = fc.record({
  edgeType: fc.constant('pass' as const),
  label: fc.option(fc.constant('Pass'), { nil: undefined }),
});

const failEdgeDataArb = fc.record({
  edgeType: fc.constant('fail' as const),
  label: fc.option(fc.constantFrom('Fail', 'Reject'), { nil: undefined }),
});

// 属性测试：验证边样式与类型一致
fc.assert(
  fc.property(edgePropsArb(anyEdgeDataArb), (props) => {
    const { container } = renderBranchEdge(props);
    const pathElement = container.querySelector('path.react-flow__edge-path');
    
    const expectedColor = props.data.edgeType === 'pass' ? '#10b981' : '#ef4444';
    expect(pathElement?.getAttribute('style')).toContain(`stroke: ${expectedColor}`);
  }),
  { numRuns: 100 }
);
```

**Property 11: Step Navigation Consistency (步骤导航一致性)**

验证需求 6.2：对于任意步骤点击侧边栏后，Builder Workspace 应正确导航到该步骤并显示其当前 micro-step 状态。

测试场景：
- 状态更新：验证点击步骤后 currentStepIndex 正确更新
- Micro-step 重置：验证导航后 currentMicroStep 重置为 'context'
- 幂等性：验证点击已激活步骤不改变状态
- 连续导航：验证多次点击后最终状态反映最后点击的步骤
- 视觉反馈：验证被点击步骤显示激活样式 (bg-indigo-50)

```typescript
// 测试示例
fc.assert(
  fc.property(stepsArrayArb, fc.integer({ min: 0, max: 9 }), (steps, targetIndexRaw) => {
    const targetIndex = targetIndexRaw % steps.length;
    useBuilderStore.getState().reset();
    
    const { container } = render(<Sidebar steps={steps} ... />);
    const stepButtons = container.querySelectorAll('nav ul li button');
    
    // 点击目标步骤
    fireEvent.click(stepButtons[targetIndex]);
    
    // 验证状态更新
    const { currentStepIndex, currentMicroStep } = useBuilderStore.getState();
    expect(currentStepIndex).toBe(targetIndex);
    expect(currentMicroStep).toBe('context');
  }),
  { numRuns: 100 }
);
```

**Property 12: Workflow Card Display Completeness (工作流卡片显示完整性)**

验证需求 1.4：对于任意工作流显示为卡片时，卡片应显示封面图（如果存在）、标题、最后编辑日期和状态徽章。

测试场景：
- 标题显示：验证任意工作流的标题正确显示
- 封面图显示：验证有封面图时正确显示图片
- 占位符显示：验证无封面图时显示占位符（📋）
- 日期格式化：验证日期以中文格式正确显示
- 状态徽章：验证状态徽章显示正确文本（草稿/已部署）

```typescript
// 测试示例
import * as fc from 'fast-check';
import { WorkflowSummary } from '@/api/generated/models/WorkflowSummary';

// 生成随机 WorkflowSummary 对象
// 注意：使用 WorkflowSummary.status 枚举类型确保类型兼容性
const workflowSummaryArb = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,20}$/),
  status: fc.constantFrom(WorkflowSummary.status.DRAFT, WorkflowSummary.status.DEPLOYED),
  updated_at: fc.date().map(d => d.toISOString()),
  // ...
});

// 属性测试：验证所有必需元素同时显示
fc.assert(
  fc.property(workflowSummaryArb, (workflow) => {
    const { container } = render(<WorkflowCard workflow={workflow} />);
    
    // 验证标题
    expect(container.textContent).toContain(workflow.name);
    
    // 验证状态徽章
    const expectedBadgeText = workflow.status === 'deployed' ? '已部署' : '草稿';
    expect(screen.getByText(expectedBadgeText)).toBeInTheDocument();
  }),
  { numRuns: 50 }
);
```

```bash
# 运行前端属性测试
npm run frontend:test

# 运行特定属性测试文件
cd frontend
npx vitest run src/components/dashboard/WorkflowCard.property.test.tsx
```

### 前端类型系统

前端提供了完整的 TypeScript 类型定义，位于 `frontend/src/types/index.ts`，与后端 Schema 保持一致。

**类型分类：**

| 分类 | 类型 | 说明 |
|------|------|------|
| Workflow | `WorkflowResponse`, `WorkflowCreate`, `WorkflowUpdate` | 工作流 CRUD 类型 |
| Step | `WorkflowStepResponse`, `WorkflowStepCreate` | 步骤相关类型 |
| Example | `ExampleResponse`, `ExampleCreate` | Few-Shot 样本类型 |
| Protocol | `ProtocolWorkflow`, `ProtocolStep` | Protocol JSON 输出类型 |
| Micro-Step | `ContextData`, `ExtractionData`, `LogicData`, `RoutingData` | Builder UI 微步骤数据类型 |

**枚举类型：**
- `WorkflowStatus`: `'draft' | 'deployed'`
- `StepStatus`: `'pending' | 'completed'`
- `ContextType`: `'image' | 'text' | 'voice'`
- `LogicStrategy`: `'rule_based' | 'few_shot'`
- `ExampleLabel`: `'PASS' | 'FAIL'`

**类型守卫函数：**
```typescript
import { isWorkflowStatus, isLogicStrategy, isExampleLabel } from '@/types';

// 运行时类型检查
if (isWorkflowStatus(value)) {
  // value 类型为 WorkflowStatus
}
```

### 前端 API 配置

前端使用 OpenAPI 生成的类型安全客户端与后端通信。API 配置位于 `frontend/src/api/config.ts`：

```typescript
import { initializeApi } from './api/config';

// 在应用启动时初始化 API 配置
initializeApi();
```

**环境变量配置：**

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8000` |

**配置文件导出：**
- `initializeApi()` - 初始化 API 客户端配置
- `getApiBaseUrl()` - 获取当前 API base URL
- `API_CONFIG` - 配置常量（BASE_URL, TIMEOUT）

### 导出 OpenAPI 规范

后端提供了一个脚本用于导出 OpenAPI 规范到 JSON 文件：

```bash
# 在项目根目录执行
python backend/export_openapi.py
```

该脚本会：
- 生成 `backend/openapi.json` 文件
- 输出 API 端点总数
- 列出所有可用的 API 端点

导出的 OpenAPI 规范可用于：
- 生成 API 客户端代码
- 导入到 Postman/Swagger UI 等工具
- 前端 TypeScript 类型生成

## 文档

详细的产品需求文档请参阅 [PRD.md](./PRD.md)。

## License

MIT
