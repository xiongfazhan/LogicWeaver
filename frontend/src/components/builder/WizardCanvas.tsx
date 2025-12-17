/**
 * WizardCanvas 组件
 * Builder 主面板，包含微步骤进度条和 Wizard 卡片区域
 * 需求: 6.1, 6.3, 6.4
 */
import { useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MicroStepProgress } from './MicroStepProgress';
import { ContextCard } from './ContextCard';
import { ExtractionCard } from './ExtractionCard';
import { LogicCard } from './LogicCard';
import { RoutingCard } from './RoutingCard';
import { 
  useBuilderStore, 
  MICRO_STEP_LABELS,
  MICRO_STEP_ORDER 
} from '../../stores/builderStore';
import { useUpdateStep } from '../../hooks/useSteps';
import type { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';
import type { WorkflowStepUpdate } from '../../api/generated/models/WorkflowStepUpdate';

interface WizardCanvasProps {
  /** 当前步骤数据 */
  currentStep: WorkflowStepResponse | null;
  /** 工作流 ID */
  workflowId: string;
  /** 所有步骤列表 */
  allSteps: WorkflowStepResponse[];
  /** 总步骤数 */
  totalSteps: number;
  /** 点击下一步回调 */
  onNext: () => void;
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
  allSteps,
  totalSteps,
  onNext,
  onPrevious,
  isLoading,
}: WizardCanvasProps) {
  const { 
    currentStepIndex, 
    currentMicroStep,
    isFirstMicroStep,
    isLastMicroStep,
  } = useBuilderStore();

  const updateStep = useUpdateStep();

  const microStepIndex = MICRO_STEP_ORDER.indexOf(currentMicroStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  
  // 判断是否可以后退
  const canGoPrevious = !isFirstMicroStep() || !isFirstStep;
  
  // 判断是否是整个流程的最后一步
  const isVeryLastStep = isLastStep && isLastMicroStep();

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

    switch (currentMicroStep) {
      case 'context':
        return (
          <ContextCard
            step={currentStep}
            onUpdate={handleStepUpdate}
            isSaving={updateStep.isPending}
          />
        );
      case 'extraction':
        return (
          <ExtractionCard
            step={currentStep}
            onUpdate={handleStepUpdate}
            isSaving={updateStep.isPending}
          />
        );
      case 'logic':
        return (
          <LogicCard
            step={currentStep}
            onUpdate={handleStepUpdate}
            isSaving={updateStep.isPending}
          />
        );
      case 'routing':
        return (
          <RoutingCard
            step={currentStep}
            workflowId={workflowId}
            allSteps={allSteps}
            onUpdate={handleStepUpdate}
            isSaving={updateStep.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-slate-50">
      {/* Micro-Step Progress */}
      <div className="max-w-2xl mx-auto mb-8">
        <MicroStepProgress clickable />
      </div>

      {/* Wizard Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
              {getMicroStepLetter(microStepIndex)}
            </span>
            {MICRO_STEP_LABELS[currentMicroStep]} (Micro-Step {getMicroStepLetter(microStepIndex)})
          </CardTitle>
          {currentStep && (
            <p className="text-sm text-slate-500">
              步骤 {currentStepIndex + 1}/{totalSteps}: {currentStep.name || '未命名步骤'}
            </p>
          )}
        </CardHeader>
        <CardContent>
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

      {/* Navigation Buttons */}
      <div className="max-w-2xl mx-auto mt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="text-slate-600"
        >
          上一步
        </Button>
        <Button
          onClick={onNext}
          disabled={!currentStep}
        >
          {isVeryLastStep ? '完成' : '下一步 →'}
        </Button>
      </div>
    </main>
  );
}

export default WizardCanvas;
