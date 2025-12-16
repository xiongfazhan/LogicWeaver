# 实现计划

## 第一阶段：项目初始化与基础设施

- [ ] 1. 初始化项目结构
  - [ ] 1.1 创建 monorepo 结构，包含 `frontend/` 和 `backend/` 目录


    - 设置根目录配置文件
    - _需求: N/A (基础设施)_
  - [ ] 1.2 初始化 FastAPI 后端（优先）
    - 创建 FastAPI 项目结构：routers, services, models, schemas 目录
    - 配置 SQLAlchemy, Alembic, Pydantic
    - 配置 CORS 中间件
    - _需求: N/A (基础设施)_
  - [ ] 1.3 设置 PostgreSQL 数据库和初始迁移
    - 使用 Alembic 创建数据库 schema
    - _需求: N/A (基础设施)_
  - [ ] 1.4 初始化 React 前端（后端 API 就绪后）
    - 配置 Vite, TypeScript, Tailwind CSS, Shadcn/UI
    - 设置 React Router v6
    - _需求: N/A (基础设施)_

## 第二阶段：后端核心 - 模型与 API

- [ ] 2. 实现数据库模型和 Pydantic Schemas
  - [ ] 2.1 创建 SQLAlchemy 模型 (Workflow, WorkflowStep, Example, RoutingBranch)
    - 实现所有模型关系和约束
    - _需求: 7.1, 7.2, 7.3, 10.1_
  - [ ] 2.2 创建 Pydantic schemas 用于 API 请求/响应
    - WorkflowCreate, WorkflowResponse, StepCreate, StepResponse 等
    - 启动 FastAPI 后可通过 /docs 查看 OpenAPI 文档
    - _需求: 7.1, 7.2, 7.3_
  - [ ]* 2.3 编写 workflow 序列化 round-trip 属性测试
    - **Property 1: Workflow Serialization Round-Trip**
    - **验证需求: 7.4, 7.5**

- [ ] 3. 实现 Workflow CRUD API
  - [ ] 3.1 创建 workflow repository 层
    - 实现 create, read, update, delete 操作
    - _需求: 1.3, 10.1, 10.2_
  - [ ] 3.2 创建 workflow service 层
    - 工作流管理的业务逻辑
    - _需求: 1.3, 10.1_
  - [ ] 3.3 创建 workflow API router (`/api/workflows`)
    - GET /workflows, POST /workflows, GET /workflows/{id}, PUT /workflows/{id}, DELETE /workflows/{id}
    - _需求: 1.1, 1.3, 1.4_
  - [ ]* 3.4 编写 workflow 持久化 round-trip 属性测试
    - **Property 2: Workflow Persistence Round-Trip**
    - **验证需求: 10.1, 10.2, 10.3**

- [ ] 4. 实现 Step 管理 API
  - [ ] 4.1 创建 step repository 和 service 层
    - 工作流步骤的 CRUD 操作
    - _需求: 6.5, 5.2, 5.4_
  - [ ] 4.2 创建 step API router (`/api/workflows/{id}/steps`)
    - GET, POST, PUT, DELETE 步骤接口
    - _需求: 6.5_
  - [ ]* 4.3 编写步骤添加不变量属性测试
    - **Property 4: Step Addition Invariant**
    - **验证需求: 6.5**
  - [ ]* 4.4 编写分支删除完整性属性测试
    - **Property 5: Branch Removal Completeness**
    - **验证需求: 5.4**

- [ ] 5. 实现 Example 管理 API
  - [ ] 5.1 创建 example repository 和 service 层
    - 处理 passing/failing 样本上传，确保正确标签
    - _需求: 4.4, 4.5_
  - [ ] 5.2 创建 example API 端点
    - POST /steps/{id}/examples, DELETE /examples/{id}
    - _需求: 4.4, 4.5_
  - [ ]* 5.3 编写样本标签一致性属性测试
    - **Property 3: Example Labeling Consistency**
    - **验证需求: 4.4, 4.5**

- [ ] 6. 实现 Protocol JSON 生成
  - [ ] 6.1 创建 protocol service
    - 将 Workflow 转换为 ProtocolWorkflow JSON 格式
    - **重要**: 实现 logic_strategy 映射函数 (few_shot → SEMANTIC_SIMILARITY)
    - _需求: 7.1, 7.2, 7.3_
  - [ ] 6.2 创建 protocol API 端点 (`/api/protocol/{workflow_id}`)
    - 生成并返回 protocol JSON
    - _需求: 7.1_
  - [ ]* 6.3 编写 protocol JSON 结构完整性属性测试
    - **Property 6: Protocol JSON Structure Completeness**
    - **验证需求: 7.1**
  - [ ]* 6.4 编写 few-shot 样本结构属性测试
    - **Property 7: Few-Shot Examples Structure**
    - **验证需求: 7.2**
  - [ ]* 6.5 编写 routing map 结构属性测试
    - **Property 8: Routing Map Structure**
    - **验证需求: 7.3**

- [ ] 7. 实现文件上传 API
  - [ ] 7.1 创建 file service 处理图片上传
    - 处理文件存储（本地文件系统）
    - **重要**: 配置 FastAPI StaticFiles 挂载 /uploads 目录
    - _需求: 2.2_
  - [ ] 7.2 创建 file API 端点 (`/api/files/upload`)
    - POST multipart/form-data 上传
    - 返回可访问的图片 URL
    - _需求: 2.2_

- [ ] 8. 检查点 - 后端 API 完成
  - 确保所有测试通过，如有问题请询问用户。
  - 导出 openapi.json 供前端使用


## 第三阶段：前端核心 - 状态管理与 API 集成

- [ ] 9. 设置前端状态管理和 API 客户端
  - [ ] 9.1 从后端 OpenAPI 生成 TypeScript 客户端
    - 使用 openapi-typescript-codegen 生成类型和 API 客户端
    - `npx openapi-typescript-codegen --input http://localhost:8000/openapi.json --output ./src/api/generated`
    - _需求: N/A (基础设施)_
  - [ ] 9.2 创建 Zustand stores (workflowStore, builderStore)
    - 实现状态结构和 actions
    - _需求: 6.2, 6.4_
  - [ ] 9.3 配置 Axios 和 TanStack Query
    - 配置 base URL, interceptors, 错误处理
    - 创建 useWorkflows, useWorkflow, useCreateWorkflow 等 hooks
    - _需求: 1.1, 1.3_

- [ ] 10. 实现 TypeScript 类型和工具函数
  - [ ] 10.1 验证生成的 TypeScript 接口与后端 schemas 匹配
    - Workflow, WorkflowStep, Example, RoutingBranch, Protocol 类型
    - _需求: 7.1, 7.2, 7.3_
  - [ ] 10.2 创建数据转换工具函数
    - Protocol 序列化/反序列化辅助函数
    - _需求: 7.4, 7.5_

## 第四阶段：前端 UI - Dashboard

- [ ] 11. 实现 Dashboard 页面
  - [ ] 11.1 创建 Dashboard 布局组件
    - 包含标题和用户头像的 Header
    - 工作流卡片的 Grid 布局
    - _需求: 1.1_
  - [ ] 11.2 创建 WorkflowCard 组件
    - 显示封面图、标题、日期、状态徽章
    - _需求: 1.4_
  - [ ]* 11.3 编写工作流卡片显示完整性属性测试
    - **Property 12: Workflow Card Display Completeness**
    - **验证需求: 1.4**
  - [ ] 11.4 创建 CreateWorkflowModal 组件
    - 包含名称、描述、封面图上传的表单
    - _需求: 1.2, 1.3_

## 第五阶段：前端 UI - Builder Workspace

- [ ] 12. 实现 Builder Workspace 布局
  - [ ] 12.1 创建 Builder 页面，包含侧边栏 + 主面板布局
    - 左侧边栏用于步骤导航
    - 右侧面板用于 wizard canvas
    - _需求: 6.1_
  - [ ] 12.2 创建 Sidebar 组件，包含步骤列表
    - 显示已完成/当前/未来状态的步骤
    - 添加新步骤按钮
    - _需求: 6.1, 6.5_
  - [ ]* 12.3 编写步骤导航一致性属性测试
    - **Property 11: Step Navigation Consistency**
    - **验证需求: 6.2**
  - [ ] 12.4 创建 MicroStepProgress 组件
    - 水平进度指示器 (Context → Extraction → Logic → Routing)
    - _需求: 6.3_

- [ ] 13. 实现各 Micro-Step 的 Wizard Cards
  - [ ] 13.1 创建 ContextCard (Micro-Step A)
    - 图片上传、文本输入、语音描述选项
    - _需求: 2.1, 2.2, 2.3_
  - [ ] 13.2 创建 ExtractionCard (Micro-Step B)
    - 关键词输入、语音描述选项
    - _需求: 3.1, 3.2_
  - [ ] 13.3 创建 LogicCard (Micro-Step C)
    - 硬规则和 Few-Shot 模式切换
    - 通过/失败样本上传区域
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ] 13.4 创建 RoutingCard (Micro-Step D)
    - 默认下一步卡片
    - 条件分支卡片，支持添加/删除
    - _需求: 5.1, 5.2, 5.3, 5.4_

- [ ] 14. 检查点 - Builder Workspace 完成
  - 确保所有测试通过，如有问题请询问用户。

## 第六阶段：前端 UI - Review 与 Flowchart

- [ ] 15. 实现 Split Screen Review 页面
  - [ ] 15.1 创建 Review 页面布局
    - 两列 grid 布局
    - _需求: 8.1_
  - [ ] 15.2 创建 SourcePanel 组件（左侧）
    - 显示音频转录、图片、上传的样本
    - _需求: 8.2_
  - [ ] 15.3 创建 ProtocolPanel 组件（右侧）
    - 将 JSON 逻辑渲染为 UI 卡片和徽章
    - _需求: 8.3_
  - [ ] 15.4 添加 "生成流程图" 按钮导航
    - _需求: 8.4_

- [ ] 16. 实现 Visual Flowchart 页面
  - [ ] 16.1 设置 ReactFlow 画布
    - 配置 ReactFlow 自定义节点和边类型
    - _需求: 9.1_
  - [ ] 16.2 创建 StepNode 组件
    - 富卡片节点，包含标题、缩略图、状态徽章
    - _需求: 9.2_
  - [ ]* 16.3 编写流程图节点完整性属性测试
    - **Property 9: Flowchart Node Completeness**
    - **验证需求: 9.1, 9.2**
  - [ ] 16.4 创建自定义边样式
    - 成功路径为绿色，失败路径为红色
    - _需求: 9.3_
  - [ ]* 16.5 编写流程图边样式属性测试
    - **Property 10: Flowchart Edge Styling**
    - **验证需求: 9.3**
  - [ ] 16.6 实现 workflow 到 flowchart 的转换
    - 将工作流步骤和路由转换为 ReactFlow 节点/边
    - _需求: 9.4_

- [ ] 17. 最终检查点 - 所有功能完成
  - 确保所有测试通过，如有问题请询问用户。
