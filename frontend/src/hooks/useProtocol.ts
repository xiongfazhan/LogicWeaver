/**
 * Protocol 相关的 React Query Hooks
 * 需求: 7.1 - Protocol JSON 生成
 */
import { useQuery } from '@tanstack/react-query';
import { 
  ProtocolService,
  type ProtocolWorkflow,
  ApiError,
} from '../api';
import { queryKeys } from '../lib/queryClient';

/**
 * 获取工作流的 Protocol JSON
 * 需求: 7.1 - WHEN a workflow step is completed THEN the System SHALL generate a JSON object
 */
export function useProtocol(workflowId: string | null) {
  return useQuery<ProtocolWorkflow, ApiError>({
    queryKey: queryKeys.protocol.detail(workflowId || ''),
    queryFn: async () => {
      if (!workflowId) throw new Error('Workflow ID is required');
      return await ProtocolService.getProtocolApiProtocolWorkflowIdGet(workflowId);
    },
    enabled: !!workflowId,
    // Protocol 数据不需要频繁刷新
    staleTime: 10 * 60 * 1000, // 10 分钟
  });
}
