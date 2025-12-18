/**
 * Builder Workspace 页面
 * 核心采集器，包含侧边栏步骤导航和 Wizard Canvas
 * 需求: 6.1, 6.2, 6.3, 6.4, 6.5
 */
import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar, WizardCanvas } from '../components/builder';
import { useWorkflow } from '../hooks/useWorkflows';
import { useSteps, useCreateStep, useUpdateStep } from '../hooks/useSteps';
import { useBuilderStore, MICRO_STEP_ORDER } from '../stores/builderStore';
import { Loader2 } from 'lucide-react';

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Store state
  const { 
    currentStepIndex,
    setCurrentWorkflow,
    setCurrentStep,
    nextMicroStep,
    prevMicroStep,
    goToStep,
    reset,
  } = useBuilderStore();

  // API hooks
  const { data: workflow, isLoading: isLoadingWorkflow } = useWorkflow(id || null);
  const { data: steps = [], isLoading: isLoadingSteps } = useSteps(id || null);
  const createStepMutation = useCreateStep();
  const updateStepMutation = useUpdateStep();

  // 初始化 store
  useEffect(() => {
    if (id) {
      setCurrentWorkflow(id);
    }
    return () => {
      reset();
    };
  }, [id, setCurrentWorkflow, reset]);

  // 当前选中的步骤
  const currentStep = steps[currentStepIndex] || null;

  /**
   * 添加新步骤
   * 需求: 6.5 - WHEN a user clicks "Add New Step" THEN the System SHALL create a new empty step
   */
  const handleAddStep = useCallback(async () => {
    if (!id) return;
    
    const newStepOrder = steps.length + 1;
    await createStepMutation.mutateAsync({
      workflowId: id,
      data: {
        name: `步骤 ${newStepOrder}`,
        step_order: newStepOrder,
      },
    });
    
    // 添加后跳转到新步骤
    setCurrentStep(steps.length);
  }, [id, steps.length, createStepMutation, setCurrentStep]);

  /**
   * 下一步导航
   * 需求: 6.4 - WHEN a user clicks Next on the last micro-step THEN the System SHALL mark the current step as completed and advance to the next step
   */
  const handleNext = useCallback(() => {
    const advanced = nextMicroStep();
    
    if (!advanced) {
      // 已经完成当前 step 的最后一个 micro-step（Routing），标记该 step 为 completed
      if (id && currentStep?.id) {
        updateStepMutation.mutate({
          workflowId: id,
          stepId: currentStep.id,
          data: { status: 'completed' },
        });
      }

      // 已经是最后一个 micro-step，前进到下一个 step
      if (currentStepIndex < steps.length - 1) {
        goToStep(currentStepIndex + 1, 'context');
      } else {
        // 已经是最后一个步骤，可以跳转到 Review 页面
        navigate(`/workflow/${id}/review`);
      }
    }
  }, [nextMicroStep, id, currentStep?.id, currentStepIndex, steps.length, goToStep, navigate, updateStepMutation]);

  /**
   * 上一步导航
   */
  const handlePrevious = useCallback(() => {
    const retreated = prevMicroStep();
    
    if (!retreated) {
      // 已经是第一个 micro-step，后退到上一个 step 的最后一个 micro-step
      if (currentStepIndex > 0) {
        goToStep(currentStepIndex - 1, MICRO_STEP_ORDER[MICRO_STEP_ORDER.length - 1]);
      }
    }
  }, [prevMicroStep, currentStepIndex, goToStep]);

  // 加载状态
  const isLoading = isLoadingWorkflow || isLoadingSteps;

  if (isLoading && !workflow) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex">
      {/* Left Sidebar - 步骤导航 */}
      <Sidebar
        workflowName={workflow?.name || ''}
        steps={steps}
        isLoading={isLoadingSteps}
        onAddStep={handleAddStep}
        isAddingStep={createStepMutation.isPending}
      />

      {/* Right Main Panel - Wizard Canvas */}
      <WizardCanvas
        currentStep={currentStep}
        workflowId={id || ''}
        allSteps={steps}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={isLoadingSteps}
      />
    </div>
  );
}
