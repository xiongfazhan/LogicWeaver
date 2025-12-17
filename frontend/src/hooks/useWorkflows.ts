/**
 * Workflow 相关的 React Query Hooks
 * 需求: 1.1, 1.3
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  WorkflowsService,
  type WorkflowCreate,
  type WorkflowUpdate,
  type WorkflowResponse,
  type WorkflowListResponse,
  ApiError,
} from '../api';
import { queryKeys } from '../lib/queryClient';
import { useWorkflowStore } from '../stores';

/**
 * 获取工作流列表
 * 需求: 1.1 - WHEN a user visits the dashboard THEN the System SHALL display all existing workflows
 */
export function useWorkflows(page = 1, pageSize = 20) {
  const { setWorkflows, setLoading, setError } = useWorkflowStore();

  return useQuery<WorkflowListResponse, ApiError>({
    queryKey: queryKeys.workflows.list(page, pageSize),
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await WorkflowsService.listWorkflowsApiWorkflowsGet(page, pageSize);
        // 计算总页数
        const totalPages = Math.ceil(response.total / response.page_size);
        setWorkflows(response.items, {
          total: response.total,
          totalPages,
        });
        setError(null);
        return response;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to fetch workflows';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
  });
}

/**
 * 获取单个工作流详情
 */
export function useWorkflow(workflowId: string | null) {
  const { setWorkflow, setLoading, setError } = useWorkflowStore();

  return useQuery<WorkflowResponse, ApiError>({
    queryKey: queryKeys.workflows.detail(workflowId || ''),
    queryFn: async () => {
      if (!workflowId) throw new Error('Workflow ID is required');
      
      setLoading(true);
      try {
        const response = await WorkflowsService.getWorkflowApiWorkflowsWorkflowIdGet(workflowId);
        setWorkflow(response);
        setError(null);
        return response;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to fetch workflow';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!workflowId,
  });
}

/**
 * 创建工作流
 * 需求: 1.3 - WHEN a user submits a valid workflow form THEN the System SHALL create the workflow
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { setError } = useWorkflowStore();

  return useMutation<WorkflowResponse, ApiError, WorkflowCreate>({
    mutationFn: async (data) => {
      return await WorkflowsService.createWorkflowApiWorkflowsPost(data);
    },
    onSuccess: () => {
      // 创建成功后，使工作流列表缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.lists() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Failed to create workflow';
      setError(message);
    },
  });
}

/**
 * 更新工作流
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  const { updateWorkflow, setError } = useWorkflowStore();

  return useMutation<
    WorkflowResponse, 
    ApiError, 
    { workflowId: string; data: WorkflowUpdate }
  >({
    mutationFn: async ({ workflowId, data }) => {
      return await WorkflowsService.updateWorkflowApiWorkflowsWorkflowIdPut(workflowId, data);
    },
    onSuccess: (response, { workflowId }) => {
      // 更新本地缓存
      updateWorkflow(workflowId, response);
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.lists() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Failed to update workflow';
      setError(message);
    },
  });
}

/**
 * 删除工作流
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const { removeWorkflow, setError } = useWorkflowStore();

  return useMutation<void, ApiError, string>({
    mutationFn: async (workflowId) => {
      await WorkflowsService.deleteWorkflowApiWorkflowsWorkflowIdDelete(workflowId);
    },
    onSuccess: (_, workflowId) => {
      // 从本地缓存中移除
      removeWorkflow(workflowId);
      // 使列表缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.lists() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Failed to delete workflow';
      setError(message);
    },
  });
}
