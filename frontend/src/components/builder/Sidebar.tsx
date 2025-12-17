/**
 * Builder Sidebar 组件
 * 显示工作流步骤列表，支持导航和添加新步骤
 * 需求: 6.1, 6.5
 */
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  CircleDot, 
  Circle, 
  Plus, 
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { useBuilderStore, type MicroStep } from '../../stores/builderStore';
import type { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';

interface SidebarProps {
  workflowName: string;
  steps: WorkflowStepResponse[];
  isLoading?: boolean;
  onAddStep: () => void;
  isAddingStep?: boolean;
}

/**
 * 获取步骤状态图标
 * - 已完成: 绿色勾选
 * - 当前: 蓝色圆点
 * - 未来: 灰色空心圆
 */
function getStepIcon(
  stepStatus: string | undefined, 
  isActive: boolean
): React.ReactNode {
  if (isActive) {
    return <CircleDot className="w-5 h-5 text-indigo-600" />;
  }
  if (stepStatus === 'completed') {
    return <CheckCircle className="w-5 h-5 text-emerald-600" />;
  }
  return <Circle className="w-5 h-5 text-slate-400" />;
}

export function Sidebar({ 
  workflowName, 
  steps, 
  isLoading,
  onAddStep,
  isAddingStep 
}: SidebarProps) {
  const navigate = useNavigate();
  const { 
    currentStepIndex, 
    goToStep,
  } = useBuilderStore();

  const handleStepClick = (index: number) => {
    goToStep(index, 'context' as MicroStep);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <button 
          onClick={handleBack}
          className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回
        </button>
        <h2 className="font-semibold text-slate-900 truncate" title={workflowName}>
          {workflowName || '未命名工作流'}
        </h2>
      </div>

      {/* Step List */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : steps.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            暂无步骤，点击下方按钮添加
          </p>
        ) : (
          <ul className="space-y-1">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              return (
                <li key={step.id}>
                  <button
                    onClick={() => handleStepClick(index)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                      transition-colors
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                      ${step.status === 'completed' && !isActive ? 'text-slate-500' : ''}
                    `}
                  >
                    {getStepIcon(step.status, isActive)}
                    <span className="truncate flex-1">
                      {step.name || `步骤 ${index + 1}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Add Step Button */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="outline"
          className="w-full border-dashed border-2 hover:border-indigo-400 hover:text-indigo-600"
          onClick={onAddStep}
          disabled={isAddingStep}
        >
          {isAddingStep ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          添加新步骤
        </Button>
      </div>
    </aside>
  );
}

export default Sidebar;
