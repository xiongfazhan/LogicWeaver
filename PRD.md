
-----

# 通用 AI Agent 业务灵魂构建平台 (Universal SOP Architect) v2.0

**核心定位：** 专家经验数字化编译器 —— 将人类的“直觉”与“流程”编译为 AI 可执行的代码。

-----

## 第一阶段：采集端 —— “万能业务切片机”

**用户角色：** 业务专家（老师傅、资深法务、金牌客服等）
**交互逻辑：** 依然采用\*\*“4步微循环（Wizard UI）”\*\*，但在第3步和第4步引入了深度增强模块。

### 循环步骤详解

#### 步骤 A：锁定对象 (Context) —— “看哪儿？”

  * **引导语：** “这一步，你的注意力集中在哪个文件段落、屏幕区域或实物上？”
  * **输入：** [📷 拍照/截图] 或 [📄 框选文本] 或 [🎙️ 语音描述位置]。

#### 步骤 B：提取信息 (Extraction) —— “找什么？”

  * **引导语：** “你需要从中提取什么具体信息？（是某个数字、日期，还是一种感觉？）”
  * **输入：** [⌨️ 关键词] 或 [🎙️ 语音描述关注点]。

#### 步骤 C：判断逻辑 (Logic) —— 【核心升级：支持“只可意会”】

  * **原痛点：** 很多判断（如“简历不稳定”、“外壳脏污”）无法用 `>0.8` 这种硬规则描述。
  * **升级引导语：** “在这个环节，你是靠死规定（硬规则）还是靠经验感觉（软规则）？”
      * **分支 1：硬规则（Rule-Based）**
          * *输入：* “金额大于 5000”、“日期早于今天”。
      * **分支 2：软规则（Example-Based / Few-Shot）**
          * *输入：* **“我也说不清楚标准，但我给你举几个例子。”**
          * *操作：*
              * [✅ 上传 3 个“合格”的例子（图片/文本片段）]
              * [❌ 上传 3 个“不合格”的例子（图片/文本片段）]
              * *系统旁白：* “没关系，只需上传例子，AI 会自动学习您的判断标准。”

#### 步骤 D：执行路由 (Routing) —— 【核心升级：支持“看情况跳转”】

  * **原痛点：** 只能线性执行“下一步”。
  * **升级引导语：** “做完这一步，永远是去同一步吗？还是说要看情况？”
  * **输入界面：** 配置简单的 `If-Then` 跳转逻辑。
      * *情况 1：* “如果【正常/通过】，跳转到 -\> [ 下一步 / 步骤 N ]”
      * *情况 2：* “如果【异常/驳回】，跳转到 -\> [ 结束流程 / 步骤 X（复核）]”

-----

## 第二阶段：产出端 —— “通用开发协议” (The Universal JSON Spec)

这是给开发团队（或 Agent 编排引擎）看的最终产物。JSON 结构进行了重大升级，增加了 `logic_strategy` 和 `routing_map`。

### 升级版 JSON 数据包示例

为了展示“模糊逻辑”和“动态路由”，我们以\*\*“简历初筛 Agent”\*\*为例：

```json
{
  "step_id": 105,
  "step_name": "Review_Career_Stability",
  "business_domain": "HR_RECRUITMENT",

  // 1. 输入规格：告诉 AI 看哪里
  "input_spec": {
    "data_source": "PDF_RESUME",
    "target_section": "Work_Experience",
    "context_description": "Candidate's job history over the last 5 years"
  },

  // 2. 处理逻辑：【升级】支持 Few-Shot 模糊判断
  "logic_config": {
    "logic_strategy": "SEMANTIC_SIMILARITY", // 策略：语义相似度/小样本学习 (非硬规则)
    
    // AI 的“大脑参考系”：基于用户上传的例子生成
    "few_shot_examples": [
      {
        "content": "2年换4份工作，且行业跨度大...",
        "label": "UNSTABLE",
        "description": "频繁跳槽且无主线"
      },
      {
        "content": "5年在同一家公司从专员升至经理...",
        "label": "STABLE",
        "description": "晋升路径清晰"
      }
    ],
    
    // 默认兜底提示词
    "evaluation_prompt": "Based on the examples, determine if the candidate is STABLE or UNSTABLE."
  },

  // 3. 路由映射：【升级】告诉 AI 下一步去哪里
  "routing_map": {
    "default_next": "step_106", // 默认去下一步
    "branches": [
      {
        "condition_result": "UNSTABLE",
        "action_type": "REJECT_CANDIDATE",
        "next_step_id": "end_process_reject" // 路由跳转：直接结束
      },
      {
        "condition_result": "STABLE",
        "action_type": "MARK_PASS",
        "next_step_id": "step_106" // 路由跳转：进入下一轮面试安排
      }
    ]
  },

  // 4. 输出结构
  "output_schema": {
    "fields": [
      { "name": "stability_score", "type": "float" },
      { "name": "reasoning_summary", "type": "string" }
    ]
  }
}
```

-----

## 第三阶段：复核端 —— “双屏确认 + 状态机视图”

### 1\. 左文右译界面 (Split Screen)

在“逻辑（Logic）”部分的复核中，界面会有明显变化：

  * **左侧（用户输入）：**
      * 显示用户上传的 3 张“好图”和 3 张“坏图”。
      * 显示用户录音转文字：“如果像这几张图一样乱，就直接退回。”
  * **右侧（AI 理解）：**
      * **策略：** [🧠 模糊匹配模式] (Fuzzy Matching)
      * **规则摘要：** “AI 将基于您提供的 6 个案例，评估目标与案例的语义/视觉相似度。”
      * **路由逻辑：**
          * 🔴 若判定为“坏” ➔ 跳转步骤 5 (退回)
          * 🟢 若判定为“好” ➔ 跳转步骤 3 (继续)

### 2\. 全景流程图 (State Machine View)

  * **升级前：** 只有一条垂直向下的时间轴。
  * **升级后：** **网状拓扑图**。
      * 主流程在中间垂直向下。
      * **异常分支**（如：不合格、需要人工介入）会以红色线条从节点引出，指向流程结束或回滚到之前的步骤。
      * 每个节点卡片上，依然嵌入用户上传的**核心参考图/示例图**。

-----

---

# UI/UX Design Specifications v2.0

## 1. Design System (视觉识别系统)

* **Framework:** Next.js + Tailwind CSS + Shadcn/UI (Lucide React Icons).
* **Visual Style:** "Clean Industrial" (理性、克制、高对比度).
* **Color Palette:**
    * **Background:** `bg-slate-50` (App bg), `bg-white` (Card bg).
    * **Primary Action:** `bg-indigo-600` (Main Buttons, Active States).
    * **Sidebar:** `bg-slate-900` or `bg-white` with `border-r`.
    * **Status Indicators:**
        * 🟢 Success: `text-emerald-600`, `bg-emerald-50`, `border-emerald-200`.
        * 🔵 Active/Info: `text-indigo-600`, `bg-indigo-50`, `border-indigo-200`.
        * 🔴 Error/Destructive: `text-rose-600`, `bg-rose-50`, `border-rose-200`.
* **Typography:** Inter (System Sans-serif). Headers should be bold and tight.

---

## 2. Core Layouts (核心页面布局)

### Layout A: Dashboard (首页工作台)
* **Structure:** Standard Grid Layout.
* **Header:** Title "My SOP Workflows" + User Avatar.
* **Content:** A grid of cards (`grid-cols-3`).
    * **Create Card:** First card is a dashed-border button `border-dashed` with a large Plus icon and text "Create New Workflow".
    * **SOP Cards:** Display Cover Image (top half), Title, Last Edited Date, and a Badge for status (Draft/Deployed).

### Layout B: Workflow Setup Modal (工作流初始化弹窗)
* **Component:** `Dialog` (Shadcn).
* **Trigger:** Click on "Create New Workflow".
* **Form Fields:**
    * **Name:** Input (Required).
    * **Description:** Textarea.
    * **Cover Image:** Single file upload zone.
* **Action:** Primary Button "Start Building" -> Redirects to *Layout C*.

### Layout C: The Builder Workspace (核心采集器 - 侧边栏布局)
**这是本次更新的重点，采用 Sidebar + Main Content 结构。**

* **Container:** `h-screen flex overflow-hidden`.

#### 1. Left Sidebar (Macro-Navigation / 宏观导航)
* **Width:** Fixed `w-64` or `w-72`, `border-r`, `bg-white`.
* **Header:** Workflow Title (Editable) + "Back to Dashboard" icon.
* **ScrollArea:** A vertical list of **Workflow Steps** (Step 1, Step 2...).
    * **Item State - Completed:** Icon `CheckCircle` (Green), text dimmed.
    * **Item State - Active:** Icon `CircleDot` (Blue), background `bg-indigo-50`, text bold.
    * **Item State - Future:** Icon `Circle` (Gray), text muted.
* **Footer:** Sticky at bottom.
    * Button: `+ Add New Step` (Ghost variant, full width).

#### 2. Right Main Panel (The Wizard Canvas / 详细采集区)
* **Background:** `bg-slate-50`.
* **Top Bar (Micro-Navigation / 微观进度):**
    * A horizontal segmented progress indicator for the **Current Step**.
    * Segments: `Context (A)` -> `Extraction (B)` -> `Logic (C)` -> `Routing (D)`.
    * Show clearly which micro-step is active.
* **Center Stage (Content):**
    * Render the specific **Input Card** based on the current micro-step (see Section 3).
    * Layout: Centered, max-width `max-w-2xl`.
* **Bottom Bar (Action):**
    * Left: `Previous` (Ghost).
    * Right: `Next` (Solid Primary).
    * *Note:* If on Step D (Routing), button text changes to "Finish Step".

---

## 3. Component Details (组件细节规范)

### Wizard Card: Step C (Logic Definition)
**Scenario:** User defines rules or uploads examples.
* **Toggle Switch:** A large `Tabs` component centered.
    * Tab 1: "Hard Rules" (Icon: Ruler).
    * Tab 2: "Experience / Few-Shot" (Icon: Brain) -> **Default**.
* **Upload Zones (Few-Shot Mode):**
    * **Container:** `grid grid-cols-2 gap-4`.
    * **Left Zone (Pass):** `border-2 border-dashed border-emerald-200 bg-emerald-50/30`. Title: "✅ Passing Examples".
    * **Right Zone (Fail):** `border-2 border-dashed border-rose-200 bg-rose-50/30`. Title: "❌ Failing Examples".
    * **Thumbnails:** Images should have rounded corners and a remove (X) button.

### Wizard Card: Step D (Routing Configuration)
**Scenario:** User defines branching logic.
* **Layout:** Vertical Stack (`flex-col gap-3`).
* **Default Card:** Simple Card, text "Default: Go to Next Step".
* **Branch Card:**
    * Styling: Left border colored (Red/Orange).
    * Structure:
        * **Header:** "If result is [FAIL]..."
        * **Body:** Arrow icon `ArrowRight` pointing to "Action: [End Process]".
    * **Action:** Add a small "Remove Branch" button.
* **Add Button:** Dashed button at bottom "+ Add Condition Branch".

---

## 4. Review & Output Layouts (交付与产出)

### Layout D: Split Screen Review (双屏复核)
* **Container:** `grid grid-cols-2 h-full`.
* **Left Panel (Source):** `bg-slate-100 p-6 overflow-y-auto`.
    * Display raw inputs: User Audio Transcript (Chat bubble style), Images, uploaded examples.
* **Right Panel (AI Protocol):** `bg-white p-6 overflow-y-auto border-l`.
    * Display JSON logic as UI Cards.
    * Use `Badge` for key-values (e.g., `Strategy: Semantic`).
* **Floating Footer:** Glassmorphism effect. Button: "Generate Flowchart".

### Layout E: Visual Flowchart (流程图)
* **Library:** ReactFlow.
* **Node Style:** "Rich Card Node".
    * Must include: Title + **Thumbnail Image** (from Step A) + Status Badge.
    * Dimensions: approx 200px wide.
* **Edges:**
    * Success Path: Green, label "Pass".
    * Failure Path: Red, label "Fail/Reject".

---

