/**
 * Step 相关的 React Query Hooks
 * 需求: 6.5 - Step 管理
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  StepsService,
  type WorkflowStepCreate,
  type WorkflowStepUpdate,
  type WorkflowStepResponse,
  type RoutingBranchCreate,
  ApiError,
} from '../api';
import { queryKeys } from '../lib/queryClient';
import { useWorkflowStore } from '../stores';

/**
 * 获取工作流的所有步骤
 */
export function useSteps(workflowId: string | null) {
  return useQuery<WorkflowStepResponse[], ApiError>({
    queryKey: queryKeys.steps.list(workflowId || ''),
    queryFn: async () => {
      if (!workflowId) throw new Error('Workflow ID is required');
      return await StepsService.listStepsApiWorkflowsWorkflowIdStepsGet(workflowId);
    },
    enabled: !!workflowId,
  });
}

/**
 * 获取单个步骤详情
 */
export function useStep(workflowId: string | null, stepId: string | null) {
  return useQuery<WorkflowStepResponse, ApiError>({
    queryKey: queryKeys.steps.detail(workflowId || '', stepId || ''),
    queryFn: async () => {
      if (!workflowId || !stepId) throw new Error('Workflow ID and Step ID are required');
      return await StepsService.getStepApiWorkflowsWorkflowIdStepsStepIdGet(workflowId, stepId);
    },
    enabled: !!workflowId && !!stepId,
  });
}

/**
 * 创建步骤
 * 需求: 6.5 - WHEN a user clicks "Add New Step" THEN the System SHALL create a new empty step
 */
export function useCreateStep() {
  const queryClient = useQueryClient();
  const { addStep } = useWorkflowStore();

  return useMutation<
    WorkflowStepResponse, 
    ApiError, 
    { workflowId: string; data: WorkflowStepCreate; autoOrder?: boolean }
  >({
    mutationFn: async ({ workflowId, data, autoOrder = true }) => {
      return await StepsService.createStepApiWorkflowsWorkflowIdStepsPost(
        workflowId, 
        data, 
        autoOrder
      );
    },
    onSuccess: (response, { workflowId }) => {
      // 更新本地缓存
      addStep(workflowId, response);
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.steps.list(workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(workflowId) });
    },
  });
}

/**
 * 更新步骤
 */
export function useUpdateStep() {
  const queryClient = useQueryClient();
  const { updateStep } = useWorkflowStore();

  return useMutation<
    WorkflowStepResponse, 
    ApiError, 
    { workflowId: string; stepId: string; data: WorkflowStepUpdate }
  >({
    mutationFn: async ({ workflowId, stepId, data }) => {
      return await StepsService.updateStepApiWorkflowsWorkflowIdStepsStepIdPut(
        workflowId, 
        stepId, 
        data
      );
    },
    onSuccess: (response, { workflowId, stepId }) => {
      // 更新本地缓存
      updateStep(workflowId, stepId, response);
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.steps.detail(workflowId, stepId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.steps.list(workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(workflowId) });
    },
  });
}

/**
 * 删除步骤
 */
export function useDeleteStep() {
  const queryClient = useQueryClient();
  const { removeStep } = useWorkflowStore();

  return useMutation<void, ApiError, { workflowId: string; stepId: string }>({
    mutationFn: async ({ workflowId, stepId }) => {
      await StepsService.deleteStepApiWorkflowsWorkflowIdStepsStepIdDelete(workflowId, stepId);
    },
    onSuccess: (_, { workflowId, stepId }) => {
      // 从本地缓存中移除
      removeStep(workflowId, stepId);
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.steps.list(workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(workflowId) });
    },
  });
}

/**
 * 添加路由分支
 * 需求: 5.2 - WHEN a user adds a condition branch THEN the System SHALL create a new branch card
 */
export function useAddRoutingBranch() {
  const queryClient = useQueryClient();

  return useMutation<
    WorkflowStepResponse, 
    ApiError, 
    { workflowId: string; stepId: string; data: RoutingBranchCreate }
  >({
    mutationFn: async ({ workflowId, stepId, data }) => {
      return await StepsService.addRoutingBranchApiWorkflowsWorkflowIdStepsStepIdBranchesPost(
        workflowId, 
        stepId, 
        data
      );
    },
    onSuccess: (_, { workflowId, stepId }) => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.steps.detail(workflowId, stepId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(workflowId) });
    },
  });
}

/**
 * 删除路由分支
 * 需求: 5.4 - WHEN a user removes a branch THEN the System SHALL delete the branch configuration
 */
export function useRemoveRoutingBranch() {
  const queryClient = useQueryClient();

  return useMutation<
    WorkflowStepResponse, 
    ApiError, 
    { workflowId: string; stepId: string; branchId: string }
  >({
    mutationFn: async ({ workflowId, stepId, branchId }) => {
      return await StepsService.removeRoutingBranchApiWorkflowsWorkflowIdStepsStepIdBranchesBranchIdDelete(
        workflowId, 
        stepId, 
        branchId
      );
    },
    onSuccess: (_, { workflowId, stepId }) => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.steps.detail(workflowId, stepId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(workflowId) });
    },
  });
}
