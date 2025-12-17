/**
 * Example 相关的 React Query Hooks
 * 需求: 4.4, 4.5 - Few-Shot 样本管理
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ExamplesService,
  type ExampleCreate,
  type ExampleUpdate,
  type ExampleResponse,
  ApiError,
} from '../api';
import { queryKeys } from '../lib/queryClient';

/**
 * 获取步骤的所有样本
 */
export function useExamples(stepId: string | null, label?: 'PASS' | 'FAIL') {
  return useQuery<ExampleResponse[], ApiError>({
    queryKey: queryKeys.examples.list(stepId || '', label),
    queryFn: async () => {
      if (!stepId) throw new Error('Step ID is required');
      return await ExamplesService.listExamplesApiStepsStepIdExamplesGet(stepId, label);
    },
    enabled: !!stepId,
  });
}

/**
 * 获取单个样本详情
 */
export function useExample(exampleId: string | null) {
  return useQuery<ExampleResponse, ApiError>({
    queryKey: queryKeys.examples.detail(exampleId || ''),
    queryFn: async () => {
      if (!exampleId) throw new Error('Example ID is required');
      return await ExamplesService.getExampleApiExamplesExampleIdGet(exampleId);
    },
    enabled: !!exampleId,
  });
}

/**
 * 创建样本
 * 需求: 4.4 - WHEN a user uploads passing examples THEN the System SHALL store with "PASS" label
 * 需求: 4.5 - WHEN a user uploads failing examples THEN the System SHALL store with "FAIL" label
 */
export function useCreateExample() {
  const queryClient = useQueryClient();

  return useMutation<ExampleResponse, ApiError, { stepId: string; data: ExampleCreate }>({
    mutationFn: async ({ stepId, data }) => {
      return await ExamplesService.createExampleApiStepsStepIdExamplesPost(stepId, data);
    },
    onSuccess: () => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.examples.lists() });
    },
  });
}

/**
 * 更新样本
 */
export function useUpdateExample() {
  const queryClient = useQueryClient();

  return useMutation<
    ExampleResponse, 
    ApiError, 
    { exampleId: string; data: ExampleUpdate }
  >({
    mutationFn: async ({ exampleId, data }) => {
      return await ExamplesService.updateExampleApiExamplesExampleIdPut(exampleId, data);
    },
    onSuccess: (response) => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.examples.detail(response.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.examples.lists() });
    },
  });
}

/**
 * 删除样本
 */
export function useDeleteExample() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (exampleId) => {
      await ExamplesService.deleteExampleApiExamplesExampleIdDelete(exampleId);
    },
    onSuccess: () => {
      // 使相关缓存失效
      queryClient.invalidateQueries({ queryKey: queryKeys.examples.lists() });
    },
  });
}
