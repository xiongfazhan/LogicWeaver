/**
 * WizardCanvas 组件
 * Builder 主面板，包含微步骤进度条和 Wizard 卡片区域
 * 需求: 6.1, 6.3, 6.4
 */
import { useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SimpleStepCard } from './SimpleStepCard';
import { useBuilderStore } from '../../stores/builderStore';
import { useUpdateStep } from '../../hooks/useSteps';
import type { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';
import type { WorkflowStepUpdate } from '../../api/generated/models/WorkflowStepUpdate';

interface WizardCanvasProps {
  /** 当前步骤数据 */
  currentStep: WorkflowStepResponse | null;
  /** 工作流 ID */
  workflowId: string;
  /** 所有步骤列表 */
  allSteps?: WorkflowStepResponse[];
  /** 总步骤数 */
  totalSteps: number;
  /** 点击下一步回调 */
  onNext: () => void;
  onFinishReview: () => void;
  /** 点击上一步回调 */
  onPrevious: () => void;
  /** 是否正在加载 */
  isLoading?: boolean;
}

/**
 * 获取微步骤的字母标识
 */
function getMicroStepLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function WizardCanvas({
  currentStep,
  workflowId,
  totalSteps,
  onNext,
  onFinishReview,
  onPrevious,
  isLoading,
}: WizardCanvasProps) {
  const { currentStepIndex } = useBuilderStore();

  const displayStepNumber = totalSteps === 0 ? 0 : currentStepIndex + 1;

  const updateStep = useUpdateStep();

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // 判断是否可以后退
  const canGoPrevious = !isFirstStep;

  // 判断是否是整个流程的最后一步
  const isVeryLastStep = isLastStep;

  const validation = (() => {
    if (!currentStep) {
      return { isValid: false, missing: ['请先添加一个步骤'] };
    }

    const missing: string[] = [];

    const hasDescription = Boolean(
      currentStep.context_description?.trim() || currentStep.logic_evaluation_prompt?.trim()
    );
    if (!hasDescription) {
      missing.push('请用一句话说明这一步要做什么（包含标准/异常处理）');
    }

    return { isValid: missing.length === 0, missing };
  })();

  const handleFinishReview = () => {
    if (!currentStep) return;

    const confirmed = window.confirm(
      validation.isValid
        ? '确定结束采集并进入复核吗？'
        : `当前步骤未填写完整：\n${validation.missing.join('\n')}\n仍要去复核吗？`
    );
    if (!confirmed) return;
    onFinishReview();
  };

  /**
   * 处理步骤数据更新
   */
  const handleStepUpdate = useCallback((data: WorkflowStepUpdate) => {
    if (!currentStep) return;
    updateStep.mutate({
      workflowId,
      stepId: currentStep.id,
      data,
    });
  }, [currentStep, workflowId, updateStep]);

  /**
   * 渲染当前 Micro-Step 的 Wizard Card 内容
   */
  const renderMicroStepContent = () => {
    if (!currentStep) return null;

    return (
      <SimpleStepCard
        step={currentStep}
        onUpdate={handleStepUpdate}
        isSaving={updateStep.isPending}
      />
    );
  };

  return (
    <main className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
      {/* Top: Micro-Step Progress */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mx-auto">
          <div className="text-sm text-slate-600">步骤 {displayStepNumber}/{totalSteps}</div>
        </div>
      </div>

      {/* Middle: Wizard Card (content scrolls inside) */}
      <div className="flex-1 overflow-hidden px-4 pb-4">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mx-auto h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="p-4 pb-3 shrink-0 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">
                  {getMicroStepLetter(currentStepIndex)}
                </span>
                {currentStep ? (
                  <>
                    步骤 {currentStepIndex + 1}/{totalSteps}: {currentStep.name || '未命名步骤'}
                  </>
                ) : (
                  <>请先添加一个步骤开始构建工作流</>
                )}
              </CardTitle>
              <p className="text-sm text-slate-600">用一句话说明要做什么（含标准/异常处理），材料（图片/文字/语音）可选。</p>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400">
                  加载中...
                </div>
              ) : !currentStep ? (
                <div className="py-12 text-center text-slate-400">
                  请先添加一个步骤开始构建工作流
                </div>
              ) : (
                renderMicroStepContent()
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Validation + Navigation (always visible) */}
      <div className="shrink-0 border-t border-slate-200 bg-slate-50">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mx-auto px-4 py-3">
          {!validation.isValid && currentStep && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              <div className="font-medium">还差一点才能继续：</div>
              <div className="mt-1 space-y-1">
                {validation.missing.map((item) => (
                  <div key={item}>- {item}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="text-slate-600"
            >
              上一步
            </Button>
            <div className="flex items-center gap-2">
              {!isVeryLastStep && (
                <Button
                  variant="outline"
                  onClick={handleFinishReview}
                  disabled={!currentStep}
                >
                  结束采集并去复核
                </Button>
              )}

              <Button
                onClick={isVeryLastStep ? handleFinishReview : onNext}
                disabled={!currentStep || !validation.isValid}
              >
                {isVeryLastStep ? '完成并去复核' : '下一步 →'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WizardCanvas;
