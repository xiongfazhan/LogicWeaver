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

### 产出端 - "通用开发协议"
生成标准化 JSON 数据包，包含：
- 输入规格 (input_spec)
- 处理逻辑 (logic_config) - 支持语义相似度/小样本学习
- 路由映射 (routing_map)
- 输出结构 (output_schema)

### 复核端 - "双屏确认 + 状态机视图"
- 左文右译界面 (Split Screen)
- 全景流程图 (State Machine View)

## 技术栈

- **Framework:** Next.js + Tailwind CSS + Shadcn/UI
- **Icons:** Lucide React
- **Flowchart:** ReactFlow
- **Visual Style:** Clean Industrial

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 文档

详细的产品需求文档请参阅 [PRD.md](./PRD.md)。

## License

MIT
