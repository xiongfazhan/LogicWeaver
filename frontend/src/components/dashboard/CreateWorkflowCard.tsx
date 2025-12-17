/**
 * CreateWorkflowCard 组件
 * 创建新工作流的虚线卡片
 * 需求: 1.2 - WHEN a user clicks the "Create New Workflow" button THEN the System SHALL display a modal
 */
import { Plus } from 'lucide-react';

interface CreateWorkflowCardProps {
  onClick: () => void;
}

export function CreateWorkflowCard({ onClick }: CreateWorkflowCardProps) {
  return (
    <div
      onClick={onClick}
      className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Plus className="w-6 h-6 text-slate-400" />
      </div>
      <span className="text-slate-600 font-medium">创建新工作流</span>
    </div>
  );
}
