/**
 * MicroStepProgress 组件
 * 水平进度指示器，显示 Context → Extraction → Logic → Routing 四个微步骤
 * 需求: 6.3
 */
import { 
  useBuilderStore, 
  MICRO_STEP_ORDER, 
  MICRO_STEP_LABELS,
  type MicroStep 
} from '../../stores/builderStore';

interface MicroStepProgressProps {
  /** 是否允许点击切换 */
  clickable?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 获取微步骤的字母标识 (A, B, C, D)
 */
function getMicroStepLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * 获取微步骤的状态样式
 */
function getMicroStepStyles(
  step: MicroStep, 
  currentStep: MicroStep
): { circle: string; text: string; connector: string } {
  const currentIndex = MICRO_STEP_ORDER.indexOf(currentStep);
  const stepIndex = MICRO_STEP_ORDER.indexOf(step);

  if (stepIndex < currentIndex) {
    // 已完成
    return {
      circle: 'bg-emerald-600 text-white',
      text: 'text-emerald-600 font-medium',
      connector: 'bg-emerald-600',
    };
  } else if (stepIndex === currentIndex) {
    // 当前
    return {
      circle: 'bg-indigo-600 text-white',
      text: 'text-indigo-600 font-medium',
      connector: 'bg-slate-200',
    };
  } else {
    // 未来
    return {
      circle: 'bg-slate-200 text-slate-600',
      text: 'text-slate-500',
      connector: 'bg-slate-200',
    };
  }
}

export function MicroStepProgress({ 
  clickable = false, 
  className = '' 
}: MicroStepProgressProps) {
  const { currentMicroStep, setMicroStep } = useBuilderStore();

  const handleClick = (step: MicroStep) => {
    if (clickable) {
      setMicroStep(step);
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {MICRO_STEP_ORDER.map((step, index) => {
        const styles = getMicroStepStyles(step, currentMicroStep);
        const isLast = index === MICRO_STEP_ORDER.length - 1;

        return (
          <div key={step} className="flex items-center">
            {/* Step Circle and Label */}
            <button
              type="button"
              onClick={() => handleClick(step)}
              disabled={!clickable}
              className={`
                flex items-center gap-2 
                ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                transition-opacity
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center 
                  text-sm font-medium transition-colors
                  ${styles.circle}
                `}
              >
                {getMicroStepLetter(index)}
              </div>
              <span className={`text-sm transition-colors ${styles.text}`}>
                {MICRO_STEP_LABELS[step]}
              </span>
            </button>

            {/* Connector Line */}
            {!isLast && (
              <div 
                className={`w-12 h-0.5 mx-4 transition-colors ${styles.connector}`} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MicroStepProgress;
