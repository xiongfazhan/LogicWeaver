/**
 * API 模块主入口
 * 导出所有 API 服务、类型和配置
 */

// 导出配置
export { initializeApi, getApiBaseUrl, API_CONFIG } from './config';

// 导出生成的 API 服务
export {
  WorkflowsService,
  StepsService,
  ExamplesService,
  ProtocolService,
  FilesService,
  DefaultService,
} from './generated';

// 导出生成的类型
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
  
  // 错误类型
  HTTPValidationError,
  ValidationError,
} from './generated';

// 导出 API 错误类
export { ApiError, OpenAPI } from './generated';
