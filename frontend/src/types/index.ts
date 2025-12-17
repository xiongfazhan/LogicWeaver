/**
 * 前端类型定义模块
 * 
 * 此文件提供与后端 schemas 对应的 TypeScript 类型定义
 * 类型验证: 需求 7.1, 7.2, 7.3
 * 
 * 后端 Schema 对应关系:
 * - WorkflowResponse ↔ backend/app/schemas/workflow.py::WorkflowResponse
 * - WorkflowStepResponse ↔ backend/app/schemas/workflow.py::WorkflowStepResponse
 * - ExampleResponse ↔ backend/app/schemas/workflow.py::ExampleResponse
 * - RoutingBranchResponse ↔ backend/app/schemas/workflow.py::RoutingBranchResponse
 * - ProtocolWorkflow ↔ backend/app/schemas/protocol.py::ProtocolWorkflow
 * - ProtocolStep ↔ backend/app/schemas/protocol.py::ProtocolStep
 */

// 重新导出生成的类型，提供更友好的命名
export type {
  // Workflow 相关类型
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowResponse,
  WorkflowListResponse,
  WorkflowSummary,
  
  // Step 相关类型
  WorkflowStepCreate,
  WorkflowStepUpdate,
  WorkflowStepResponse,
  
  // Example 相关类型
  ExampleCreate,
  ExampleUpdate,
  ExampleResponse,
  
  // Routing 相关类型
  RoutingBranchCreate,
  RoutingBranchResponse,
  
  // Protocol 相关类型
  ProtocolWorkflow,
  ProtocolStep,
  ProtocolInputSpec,
  ProtocolLogicConfig,
  ProtocolRoutingMap,
  ProtocolRoutingBranch,
  ProtocolFewShotExample,
  ProtocolOutputSchema,
  ProtocolOutputField,
  
  // File 相关类型
  FileUploadResponse,
  FileDeleteRequest,
  FileDeleteResponse,
} from '../api/generated';

// 导出枚举命名空间 (用于访问枚举值)
export { 
  WorkflowResponse as WorkflowResponseEnum,
  WorkflowStepResponse as WorkflowStepResponseEnum,
  ExampleResponse as ExampleResponseEnum,
  ProtocolLogicConfig as ProtocolLogicConfigEnum,
  ProtocolFewShotExample as ProtocolFewShotExampleEnum,
} from '../api/generated';

// ============================================================================
// 类型别名 - 提供更语义化的命名
// ============================================================================

/** 工作流状态 */
export type WorkflowStatus = 'draft' | 'deployed';

/** 步骤状态 */
export type StepStatus = 'pending' | 'completed';

/** 上下文类型 (Micro-Step A) */
export type ContextType = 'image' | 'text' | 'voice';

/** 逻辑策略 (Micro-Step C) - 内部存储格式 */
export type LogicStrategy = 'rule_based' | 'few_shot';

/** 逻辑策略 - Protocol 输出格式 */
export type ProtocolLogicStrategy = 'RULE_BASED' | 'SEMANTIC_SIMILARITY';

/** 内容类型 */
export type ContentType = 'image' | 'text';

/** 样本标签 */
export type ExampleLabel = 'PASS' | 'FAIL';

// ============================================================================
// Micro-Step 数据类型 - 用于 Builder UI
// ============================================================================

/** Context 微步骤数据 (Micro-Step A) */
export interface ContextData {
  type: ContextType | null;
  imageUrl: string | null;
  textContent: string | null;
  voiceTranscript: string | null;
  description: string | null;
}

/** Extraction 微步骤数据 (Micro-Step B) */
export interface ExtractionData {
  keywords: string[];
  voiceTranscript: string | null;
}

/** Logic 微步骤数据 (Micro-Step C) */
export interface LogicData {
  strategy: LogicStrategy | null;
  ruleExpression: string | null;
  evaluationPrompt: string | null;
  passingExamples: ExampleData[];
  failingExamples: ExampleData[];
}

/** Example 数据 (用于 UI) */
export interface ExampleData {
  id?: string;
  content: string;
  contentType: ContentType;
  description: string | null;
}

/** Routing 微步骤数据 (Micro-Step D) */
export interface RoutingData {
  defaultNext: string | null;
  branches: RoutingBranchData[];
}

/** Routing Branch 数据 (用于 UI) */
export interface RoutingBranchData {
  id?: string;
  conditionResult: string;
  actionType: string;
  nextStepId: string;
}

// ============================================================================
// Builder UI 状态类型
// ============================================================================

/** 当前微步骤 */
export type MicroStep = 'context' | 'extraction' | 'logic' | 'routing';

/** 微步骤索引映射 */
export const MICRO_STEP_INDEX: Record<MicroStep, number> = {
  context: 0,
  extraction: 1,
  logic: 2,
  routing: 3,
};

/** 微步骤标签 */
export const MICRO_STEP_LABELS: Record<MicroStep, string> = {
  context: 'Context',
  extraction: 'Extraction',
  logic: 'Logic',
  routing: 'Routing',
};

// ============================================================================
// 类型守卫函数
// ============================================================================

/** 检查是否为有效的工作流状态 */
export function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return value === 'draft' || value === 'deployed';
}

/** 检查是否为有效的步骤状态 */
export function isStepStatus(value: unknown): value is StepStatus {
  return value === 'pending' || value === 'completed';
}

/** 检查是否为有效的上下文类型 */
export function isContextType(value: unknown): value is ContextType {
  return value === 'image' || value === 'text' || value === 'voice';
}

/** 检查是否为有效的逻辑策略 */
export function isLogicStrategy(value: unknown): value is LogicStrategy {
  return value === 'rule_based' || value === 'few_shot';
}

/** 检查是否为有效的样本标签 */
export function isExampleLabel(value: unknown): value is ExampleLabel {
  return value === 'PASS' || value === 'FAIL';
}
