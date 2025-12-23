/**
 * Builder Workspace 页面
 * 核心采集器，包含侧边栏步骤导航和 Wizard Canvas
 * 需求: 6.1, 6.2, 6.3, 6.4, 6.5
 */
import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar, WizardCanvas } from '../components/builder';
import { useWorkflow } from '../hooks/useWorkflows';
import { useSteps, useCreateStep, useUpdateStep } from '../hooks/useSteps';
import { useAnalyzeAllSteps } from '../hooks/useAnalysis';
import { useBuilderStore } from '../stores/builderStore';
import { Loader2, Brain, CheckCircle, XCircle } from 'lucide-react';

// 分析状态类型
type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error';

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 分析状态
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisMessage, setAnalysisMessage] = useState('');

  // Store state
  const {
    currentStepIndex,
    setCurrentWorkflow,
    setCurrentStep,
    reset,
  } = useBuilderStore();

  // API hooks
  const { data: workflow, isLoading: isLoadingWorkflow } = useWorkflow(id || null);
  const { data: steps = [], isLoading: isLoadingSteps } = useSteps(id || null);
  const createStepMutation = useCreateStep();
  const updateStepMutation = useUpdateStep();
  const analyzeAllSteps = useAnalyzeAllSteps();

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
   */
  const handleNext = useCallback(() => {
    // 标记当前 step 为 completed
    if (id && currentStep?.id) {
      updateStepMutation.mutate({
        workflowId: id,
        stepId: currentStep.id,
        data: { status: 'completed' },
      });
    }

    // 前进到下一个 step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(currentStepIndex + 1);
      return;
    }

    // 已经是最后一个步骤，跳转到 Review 页面
    navigate(`/workflow/${id}/review`);
  }, [id, currentStep?.id, currentStepIndex, steps.length, navigate, updateStepMutation, setCurrentStep]);

  /**
   * 结束采集并进行 AI 分析
   * 分析所有步骤，分析完成后再跳转到 Review 页面
   */
  const handleFinishReview = useCallback(async () => {
    if (!id) return;

    // 如果没有步骤，直接跳转
    if (steps.length === 0) {
      navigate(`/workflow/${id}/review`);
      return;
    }

    // 开始分析所有步骤
    setAnalysisStatus('analyzing');
    setAnalysisMessage(`正在分析 ${steps.length} 个步骤...`);

    try {
      const stepIds = steps.map((step) => step.id);
      const results = await analyzeAllSteps.mutateAsync(stepIds);

      // 保存分析结果到 localStorage，供 Review 页面展示
      const contracts = results.map((r) => r.result.contract);
      localStorage.setItem(`contracts_${id}`, JSON.stringify(contracts));

      setAnalysisStatus('success');
      setAnalysisMessage(`分析完成！成功分析 ${results.length} 个步骤`);

      // 短暂显示成功状态后跳转
      setTimeout(() => {
        navigate(`/workflow/${id}/review`);
      }, 1500);

    } catch (error) {
      setAnalysisStatus('error');
      setAnalysisMessage(
        error instanceof Error
          ? error.message
          : 'AI 分析失败，但仍可查看复核结果'
      );

      // 3秒后允许继续
      setTimeout(() => {
        setAnalysisStatus('idle');
      }, 3000);
    }
  }, [id, steps, navigate, analyzeAllSteps]);

  /**
   * 上一步导航
   */
  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, setCurrentStep]);

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
    <div className="h-screen bg-slate-50 flex relative">
      {/* AI 分析遮罩 */}
      {analysisStatus !== 'idle' && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              {analysisStatus === 'analyzing' && (
                <>
                  <div className="relative">
                    <Brain className="w-16 h-16 text-indigo-600" />
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-1 -right-1" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">AI 正在分析样本</h3>
                  <p className="text-slate-600">{analysisMessage}</p>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </>
              )}

              {analysisStatus === 'success' && (
                <>
                  <CheckCircle className="w-16 h-16 text-emerald-600" />
                  <h3 className="text-xl font-semibold text-slate-800">分析完成</h3>
                  <p className="text-slate-600">{analysisMessage}</p>
                  <p className="text-sm text-slate-400">正在跳转到复核页面...</p>
                </>
              )}

              {analysisStatus === 'error' && (
                <>
                  <XCircle className="w-16 h-16 text-amber-500" />
                  <h3 className="text-xl font-semibold text-slate-800">分析遇到问题</h3>
                  <p className="text-slate-600">{analysisMessage}</p>
                  <button
                    onClick={() => navigate(`/workflow/${id}/review`)}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    继续前往复核
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar - 步骤导航 */}
      <Sidebar
        workflowId={id || ''}
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
        totalSteps={steps.length}
        onNext={handleNext}
        onFinishReview={handleFinishReview}
        onPrevious={handlePrevious}
        isLoading={isLoadingSteps}
      />
    </div>
  );
}
