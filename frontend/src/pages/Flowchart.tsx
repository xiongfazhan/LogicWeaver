/**
 * Flowchart 页面 - 可视化流程图
 * 需求: 9.1, 9.2, 9.3, 9.4
 */
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { Button } from '../components/ui';
import { FlowCanvas } from '../components/flowchart';
import { useWorkflow } from '../hooks';

export default function Flowchart() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: workflow, isLoading, error } = useWorkflow(id || null);

  // 返回 Review 页面
  const handleBack = () => {
    navigate(`/workflow/${id}/review`);
  };

  // 返回 Builder 页面编辑
  const handleEdit = () => {
    navigate(`/workflow/${id}/builder`);
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading flowchart...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load workflow</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // 空工作流状态
  if (!workflow.steps || workflow.steps.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header 
          workflowName={workflow.name}
          onBack={handleBack}
          onEdit={handleEdit}
        />
        <main className="h-[calc(100vh-65px)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 mb-4">No steps in this workflow yet.</p>
            <Button onClick={handleEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              Add Steps
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        workflowName={workflow.name}
        onBack={handleBack}
        onEdit={handleEdit}
      />
      
      <main className="h-[calc(100vh-65px)]">
        <FlowCanvas 
          workflow={workflow}
          className="w-full h-full"
        />
      </main>
    </div>
  );
}

/** Header 组件 */
interface HeaderProps {
  workflowName: string;
  onBack: () => void;
  onEdit: () => void;
}

function Header({ workflowName, onBack, onEdit }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Visual Flowchart
            </h1>
            <p className="text-sm text-slate-500">{workflowName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Workflow
          </Button>
        </div>
      </div>
    </header>
  );
}
