/**
 * Workflow Store
 * 管理工作流列表和单个工作流的状态
 * 需求: 6.2, 6.4
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  WorkflowResponse, 
  WorkflowSummary,
  WorkflowStepResponse,
} from '../api/generated';

/**
 * Workflow Store 状态接口
 */
interface WorkflowState {
  // 工作流列表（缓存）
  workflows: Map<string, WorkflowResponse>;
  workflowList: WorkflowSummary[];
  
  // 分页信息
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setWorkflows: (workflows: WorkflowSummary[], pagination: { total: number; totalPages: number }) => void;
  setWorkflow: (workflow: WorkflowResponse) => void;
  updateWorkflow: (id: string, updates: Partial<WorkflowResponse>) => void;
  removeWorkflow: (id: string) => void;
  getWorkflow: (id: string) => WorkflowResponse | undefined;
  
  // Step 相关 actions
  updateStep: (workflowId: string, stepId: string, updates: Partial<WorkflowStepResponse>) => void;
  addStep: (workflowId: string, step: WorkflowStepResponse) => void;
  removeStep: (workflowId: string, stepId: string) => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (page: number, pageSize: number) => void;
  
  // 清理
  clearCache: () => void;
}

/**
 * 创建 Workflow Store
 */
export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      workflows: new Map(),
      workflowList: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
      isLoading: false,
      error: null,

      // 设置工作流列表
      setWorkflows: (workflows, pagination) => {
        set({
          workflowList: workflows,
          pagination: {
            ...get().pagination,
            total: pagination.total,
            totalPages: pagination.totalPages,
          },
        });
      },

      // 设置单个工作流（完整数据，包含 steps）
      setWorkflow: (workflow) => {
        const workflows = new Map(get().workflows);
        workflows.set(workflow.id, workflow);
        set({ workflows });
      },

      // 更新工作流
      updateWorkflow: (id, updates) => {
        const workflows = new Map(get().workflows);
        const existing = workflows.get(id);
        if (existing) {
          workflows.set(id, { ...existing, ...updates });
          set({ workflows });
        }
        
        // 同时更新列表中的摘要信息
        const workflowList = get().workflowList.map(w => 
          w.id === id ? { ...w, ...updates } : w
        );
        set({ workflowList });
      },

      // 删除工作流
      removeWorkflow: (id) => {
        const workflows = new Map(get().workflows);
        workflows.delete(id);
        const workflowList = get().workflowList.filter(w => w.id !== id);
        set({ workflows, workflowList });
      },

      // 获取工作流
      getWorkflow: (id) => {
        return get().workflows.get(id);
      },

      // 更新步骤
      updateStep: (workflowId, stepId, updates) => {
        const workflows = new Map(get().workflows);
        const workflow = workflows.get(workflowId);
        if (workflow && workflow.steps) {
          const updatedSteps = workflow.steps.map(step =>
            step.id === stepId ? { ...step, ...updates } : step
          );
          workflows.set(workflowId, { ...workflow, steps: updatedSteps });
          set({ workflows });
        }
      },

      // 添加步骤
      addStep: (workflowId, step) => {
        const workflows = new Map(get().workflows);
        const workflow = workflows.get(workflowId);
        if (workflow) {
          const steps = [...(workflow.steps || []), step];
          workflows.set(workflowId, { ...workflow, steps });
          set({ workflows });
        }
      },

      // 删除步骤
      removeStep: (workflowId, stepId) => {
        const workflows = new Map(get().workflows);
        const workflow = workflows.get(workflowId);
        if (workflow && workflow.steps) {
          const steps = workflow.steps.filter(step => step.id !== stepId);
          workflows.set(workflowId, { ...workflow, steps });
          set({ workflows });
        }
      },

      // 设置加载状态
      setLoading: (loading) => set({ isLoading: loading }),

      // 设置错误
      setError: (error) => set({ error }),

      // 设置分页
      setPagination: (page, pageSize) => {
        set({
          pagination: {
            ...get().pagination,
            page,
            pageSize,
          },
        });
      },

      // 清理缓存
      clearCache: () => {
        set({
          workflows: new Map(),
          workflowList: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
          },
          error: null,
        });
      },
    }),
    { name: 'workflow-store' }
  )
);
