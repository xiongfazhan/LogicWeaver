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
import { useExamples } from '../../hooks/useExamples';
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

function getMicroStepTitle(step: string): string {
  switch (step) {
    case 'context':
      return '你要检查的材料/画面是什么？（先拍照/截图或粘贴文字）';
    case 'extraction':
      return '你要从里面看哪些点？（写关键词或直接描述）';
    case 'logic':
      return '怎么判断合格/不合格？（给规则或给正反例）';
    case 'routing':
      return '检查通过/不通过后怎么处理？（下一步走哪）';
    default:
      return '';
  }
}

function getMicroStepGuide(step: string): string {
  switch (step) {
    case 'context':
      return '像带徒弟一样：先把要检查的东西交给他（图片/文字/语音三选一即可）。';
    case 'extraction':
      return '告诉 AI 你要关注哪些信息点，比如“是否漏油、温度、压力、异响”等。';
    case 'logic':
      return '标准说得清就写规则；说不清就上传/填写正反例，让 AI 学会你的判断。';
    case 'routing':
      return '配置“通过走哪里、不通过走哪里”，不想分支也可以先用默认下一步。';
    default:
      return '';
  }
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

  const stepId = currentStep?.id || null;
  const { data: passingExamples = [] } = useExamples(stepId, 'PASS');
  const { data: failingExamples = [] } = useExamples(stepId, 'FAIL');

  const microStepIndex = MICRO_STEP_ORDER.indexOf(currentMicroStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  
  // 判断是否可以后退
  const canGoPrevious = !isFirstMicroStep() || !isFirstStep;
  
  // 判断是否是整个流程的最后一步
  const isVeryLastStep = isLastStep && isLastMicroStep();

  const validation = (() => {
    if (!currentStep) {
      return { isValid: false, missing: ['请先添加一个步骤'] };
    }

    const missing: string[] = [];

    if (currentMicroStep === 'context') {
      const hasAny = Boolean(
        currentStep.context_image_url ||
          currentStep.context_text_content ||
          currentStep.context_voice_transcript
      );
      if (!hasAny) {
        missing.push('请提供图片/文字/语音中的任意一种（至少填 1 个）');
      }
    }

    if (currentMicroStep === 'extraction') {
      const keywordsCount = currentStep.extraction_keywords?.length || 0;
      const hasVoice = Boolean(currentStep.extraction_voice_transcript?.trim());
      if (keywordsCount === 0 && !hasVoice) {
        missing.push('请至少添加 1 个关键词，或用一句话描述要看哪些点');
      }
    }

    if (currentMicroStep === 'logic') {
      const strategy = (currentStep.logic_strategy || 'few_shot') as
        | 'rule_based'
        | 'few_shot';

      if (strategy === 'rule_based') {
        if (!currentStep.logic_rule_expression?.trim()) {
          missing.push('请填写判断规则（例如：温度 > 80 AND 无漏油）');
        }
      } else {
        if (passingExamples.length === 0) {
          missing.push('请至少提供 1 条“合格/正常”的例子（图片或文字）');
        }
        if (failingExamples.length === 0) {
          missing.push('请至少提供 1 条“不合格/异常”的例子（图片或文字）');
        }
      }
    }

    return { isValid: missing.length === 0, missing };
  })();

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
    <main className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
      {/* Top: Micro-Step Progress */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mx-auto">
          <MicroStepProgress />
        </div>
      </div>

      {/* Middle: Wizard Card (content scrolls inside) */}
      <div className="flex-1 overflow-hidden px-4 pb-4">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mx-auto h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="p-4 pb-3 shrink-0 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">
                  {getMicroStepLetter(microStepIndex)}
                </span>
                {MICRO_STEP_LABELS[currentMicroStep]}：{getMicroStepTitle(currentMicroStep)}
              </CardTitle>
              <p className="text-sm text-slate-600">{getMicroStepGuide(currentMicroStep)}</p>
              {currentStep && (
                <p className="text-xs text-slate-500">
                  步骤 {currentStepIndex + 1}/{totalSteps}: {currentStep.name || '未命名步骤'}
                </p>
              )}
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
            <Button
              onClick={onNext}
              disabled={!currentStep || !validation.isValid}
            >
              {isVeryLastStep ? '完成并去复核' : '下一步 →'}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WizardCanvas;
