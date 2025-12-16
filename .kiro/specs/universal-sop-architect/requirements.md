# Requirements Document

## Introduction

Universal SOP Architect 是一个专家经验数字化编译平台，将业务专家的"直觉"与"流程"编译为 AI 可执行的协议。平台通过 4 步微循环 Wizard UI 采集业务逻辑，支持硬规则和软规则（Few-Shot）两种判断模式，并输出标准化 JSON 协议供 Agent 引擎执行。

## Glossary

- **SOP (Standard Operating Procedure)**: 标准操作流程，业务专家定义的工作步骤序列
- **Workflow**: 工作流，由多个 Step 组成的完整业务流程
- **Step**: 工作流中的单个步骤，包含 Context、Extraction、Logic、Routing 四个微步骤
- **Micro-Step**: 微步骤，Step 内部的 4 个子阶段 (A/B/C/D)
- **Hard Rule**: 硬规则，可用明确条件表达的判断逻辑（如 "金额 > 5000"）
- **Soft Rule (Few-Shot)**: 软规则，通过正反例样本让 AI 学习的模糊判断逻辑
- **Routing**: 路由，根据判断结果决定流程走向的分支逻辑
- **Protocol JSON**: 协议 JSON，平台输出的标准化数据结构，供 Agent 引擎消费

## Requirements

### Requirement 1: Workflow Management

**User Story:** As a business expert, I want to create and manage SOP workflows, so that I can organize my business processes digitally.

#### Acceptance Criteria

1. WHEN a user visits the dashboard THEN the System SHALL display all existing workflows as a grid of cards
2. WHEN a user clicks the "Create New Workflow" button THEN the System SHALL display a modal with name, description, and cover image fields
3. WHEN a user submits a valid workflow form THEN the System SHALL create the workflow and redirect to the Builder Workspace
4. WHEN a user views a workflow card THEN the System SHALL display the cover image, title, last edited date, and status badge


### Requirement 2: Step Collection - Context (Micro-Step A)

**User Story:** As a business expert, I want to specify where to focus attention in a document or screen, so that the AI knows exactly what area to examine.

#### Acceptance Criteria

1. WHEN a user enters the Context micro-step THEN the System SHALL display options for photo/screenshot upload, text selection, or voice description
2. WHEN a user uploads an image THEN the System SHALL store the image and display a thumbnail preview
3. WHEN a user provides text selection THEN the System SHALL capture and store the selected text content
4. WHEN a user provides voice input THEN the System SHALL transcribe the audio and store the text description

### Requirement 3: Step Collection - Extraction (Micro-Step B)

**User Story:** As a business expert, I want to specify what information to extract from the context, so that the AI knows what data points to look for.

#### Acceptance Criteria

1. WHEN a user enters the Extraction micro-step THEN the System SHALL display input options for keywords or voice description
2. WHEN a user enters keywords THEN the System SHALL store the keywords as extraction targets
3. WHEN a user provides voice input THEN the System SHALL transcribe and store the extraction criteria

### Requirement 4: Step Collection - Logic (Micro-Step C)

**User Story:** As a business expert, I want to define judgment logic using either hard rules or example-based learning, so that the AI can make decisions like I would.

#### Acceptance Criteria

1. WHEN a user enters the Logic micro-step THEN the System SHALL display a toggle between "Hard Rules" and "Experience/Few-Shot" modes
2. WHEN a user selects Hard Rules mode THEN the System SHALL display a text input for condition expressions
3. WHEN a user selects Few-Shot mode THEN the System SHALL display two upload zones for passing and failing examples
4. WHEN a user uploads passing examples THEN the System SHALL store the examples with a "PASS" label
5. WHEN a user uploads failing examples THEN the System SHALL store the examples with a "FAIL" label
6. WHEN displaying Few-Shot upload zones THEN the System SHALL show the passing zone with green styling and failing zone with red styling


### Requirement 5: Step Collection - Routing (Micro-Step D)

**User Story:** As a business expert, I want to define conditional branching logic, so that the workflow can take different paths based on judgment results.

#### Acceptance Criteria

1. WHEN a user enters the Routing micro-step THEN the System SHALL display a default "Go to Next Step" card
2. WHEN a user adds a condition branch THEN the System SHALL create a new branch card with condition and action fields
3. WHEN a user configures a branch THEN the System SHALL allow selection of condition result and target step
4. WHEN a user removes a branch THEN the System SHALL delete the branch configuration
5. WHEN displaying branch cards THEN the System SHALL show failure branches with red left border styling

### Requirement 6: Builder Workspace Navigation

**User Story:** As a business expert, I want to navigate between workflow steps and micro-steps easily, so that I can build complex workflows efficiently.

#### Acceptance Criteria

1. WHEN a user enters the Builder Workspace THEN the System SHALL display a left sidebar with all workflow steps
2. WHEN a user clicks a step in the sidebar THEN the System SHALL navigate to that step and show its micro-step wizard
3. WHEN a user views the top bar THEN the System SHALL display a horizontal progress indicator showing Context, Extraction, Logic, and Routing segments
4. WHEN a user clicks Next on the last micro-step THEN the System SHALL mark the current step as completed and advance to the next step
5. WHEN a user clicks "Add New Step" THEN the System SHALL create a new empty step and add it to the sidebar

### Requirement 7: Protocol JSON Generation

**User Story:** As a developer, I want the system to generate standardized JSON protocols from collected workflows, so that Agent engines can execute the business logic.

#### Acceptance Criteria

1. WHEN a workflow step is completed THEN the System SHALL generate a JSON object containing input_spec, logic_config, routing_map, and output_schema
2. WHEN logic uses Few-Shot mode THEN the System SHALL include few_shot_examples array with content, label, and description fields
3. WHEN routing has branches THEN the System SHALL include a routing_map with default_next and branches array
4. WHEN serializing a workflow to JSON THEN the System SHALL produce valid JSON that can be deserialized back to the original structure
5. WHEN deserializing JSON back to workflow THEN the System SHALL reconstruct the exact same workflow structure


### Requirement 8: Split Screen Review

**User Story:** As a business expert, I want to review my inputs alongside the AI-generated protocol, so that I can verify the system understood my intent correctly.

#### Acceptance Criteria

1. WHEN a user enters review mode THEN the System SHALL display a split-screen layout with source inputs on the left and AI protocol on the right
2. WHEN displaying source inputs THEN the System SHALL show audio transcripts, images, and uploaded examples in their original form
3. WHEN displaying AI protocol THEN the System SHALL render the JSON logic as readable UI cards with badges for key values
4. WHEN a user clicks "Generate Flowchart" THEN the System SHALL navigate to the visual flowchart view

### Requirement 9: Visual Flowchart

**User Story:** As a business expert, I want to see my workflow as a visual flowchart, so that I can understand the complete process flow at a glance.

#### Acceptance Criteria

1. WHEN a user views the flowchart THEN the System SHALL render workflow steps as rich card nodes using ReactFlow
2. WHEN rendering a node THEN the System SHALL display the step title, thumbnail image from Context, and status badge
3. WHEN rendering edges THEN the System SHALL show success paths in green with "Pass" label and failure paths in red with "Fail/Reject" label
4. WHEN a workflow has conditional branches THEN the System SHALL display the branching structure as a network topology

### Requirement 10: Data Persistence

**User Story:** As a business expert, I want my workflows to be saved automatically, so that I do not lose my work.

#### Acceptance Criteria

1. WHEN a user makes changes to a workflow THEN the System SHALL persist the changes to local storage immediately
2. WHEN a user returns to the dashboard THEN the System SHALL load all previously saved workflows
3. WHEN loading a workflow THEN the System SHALL restore all steps, micro-step data, and routing configurations
