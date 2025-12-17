/**
 * Builder Store
 * 管理 Builder Workspace 的 UI 状态
 * 需求: 6.2, 6.4
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Micro-Step 类型
 * 对应 4 步微循环: Context → Extraction → Logic → Routing
 */
export type MicroStep = 'context' | 'extraction' | 'logic' | 'routing';

/**
 * Micro-Step 顺序映射
 */
export const MICRO_STEP_ORDER: MicroStep[] = ['context', 'extraction', 'logic', 'routing'];

/**
 * Micro-Step 显示名称
 */
export const MICRO_STEP_LABELS: Record<MicroStep, string> = {
  context: 'Context',
  extraction: 'Extraction',
  logic: 'Logic',
  routing: 'Routing',
};

/**
 * Builder Store 状态接口
 */
interface BuilderState {
  // 当前工作流 ID
  currentWorkflowId: string | null;
  
  // 当前步骤索引（从 0 开始）
  currentStepIndex: number;
  
  // 当前 Micro-Step
  currentMicroStep: MicroStep;
  
  // 是否有未保存的更改
  isDirty: boolean;
  
  // 侧边栏展开状态
  isSidebarCollapsed: boolean;
  
  // Actions
  setCurrentWorkflow: (workflowId: string | null) => void;
  setCurrentStep: (index: number) => void;
  setMicroStep: (step: MicroStep) => void;
  setDirty: (dirty: boolean) => void;
  toggleSidebar: () => void;
  
  // 导航 actions
  nextMicroStep: () => boolean; // 返回是否成功前进
  prevMicroStep: () => boolean; // 返回是否成功后退
  goToStep: (stepIndex: number, microStep?: MicroStep) => void;
  
  // 获取当前 Micro-Step 索引
  getMicroStepIndex: () => number;
  
  // 检查是否是最后一个 Micro-Step
  isLastMicroStep: () => boolean;
  
  // 检查是否是第一个 Micro-Step
  isFirstMicroStep: () => boolean;
  
  // 重置状态
  reset: () => void;
}

/**
 * 初始状态
 */
const initialState = {
  currentWorkflowId: null,
  currentStepIndex: 0,
  currentMicroStep: 'context' as MicroStep,
  isDirty: false,
  isSidebarCollapsed: false,
};

/**
 * 创建 Builder Store
 */
export const useBuilderStore = create<BuilderState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 设置当前工作流
      setCurrentWorkflow: (workflowId) => {
        set({
          currentWorkflowId: workflowId,
          currentStepIndex: 0,
          currentMicroStep: 'context',
          isDirty: false,
        });
      },

      // 设置当前步骤索引
      setCurrentStep: (index) => {
        set({
          currentStepIndex: index,
          currentMicroStep: 'context', // 切换步骤时重置到第一个 micro-step
        });
      },

      // 设置当前 Micro-Step
      setMicroStep: (step) => {
        set({ currentMicroStep: step });
      },

      // 设置脏标记
      setDirty: (dirty) => {
        set({ isDirty: dirty });
      },

      // 切换侧边栏
      toggleSidebar: () => {
        set({ isSidebarCollapsed: !get().isSidebarCollapsed });
      },

      // 前进到下一个 Micro-Step
      nextMicroStep: () => {
        const { currentMicroStep } = get();
        const currentIndex = MICRO_STEP_ORDER.indexOf(currentMicroStep);
        
        if (currentIndex < MICRO_STEP_ORDER.length - 1) {
          set({ currentMicroStep: MICRO_STEP_ORDER[currentIndex + 1] });
          return true;
        }
        return false; // 已经是最后一个
      },

      // 后退到上一个 Micro-Step
      prevMicroStep: () => {
        const { currentMicroStep } = get();
        const currentIndex = MICRO_STEP_ORDER.indexOf(currentMicroStep);
        
        if (currentIndex > 0) {
          set({ currentMicroStep: MICRO_STEP_ORDER[currentIndex - 1] });
          return true;
        }
        return false; // 已经是第一个
      },

      // 跳转到指定步骤和 Micro-Step
      goToStep: (stepIndex, microStep = 'context') => {
        set({
          currentStepIndex: stepIndex,
          currentMicroStep: microStep,
        });
      },

      // 获取当前 Micro-Step 索引
      getMicroStepIndex: () => {
        return MICRO_STEP_ORDER.indexOf(get().currentMicroStep);
      },

      // 检查是否是最后一个 Micro-Step
      isLastMicroStep: () => {
        return get().currentMicroStep === MICRO_STEP_ORDER[MICRO_STEP_ORDER.length - 1];
      },

      // 检查是否是第一个 Micro-Step
      isFirstMicroStep: () => {
        return get().currentMicroStep === MICRO_STEP_ORDER[0];
      },

      // 重置状态
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'builder-store' }
  )
);

/**
 * 选择器：获取当前 Micro-Step 的进度百分比
 */
export const selectMicroStepProgress = (state: BuilderState): number => {
  const index = MICRO_STEP_ORDER.indexOf(state.currentMicroStep);
  return ((index + 1) / MICRO_STEP_ORDER.length) * 100;
};
