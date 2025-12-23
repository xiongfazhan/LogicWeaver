/**
 * Flowchart 页面 - 可视化流程图
 * 需求: 9.1, 9.2, 9.3, 9.4
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { Button } from '../components/ui';
import { FlowCanvas } from '../components/flowchart';
import { useWorkflow } from '../hooks';

/** 数据契约类型 */
interface StepContract {
  step_id: number;
  step_name: string;
  business_intent: string;
  inputs: { name: string; type: string; description: string }[];
  outputs: { name: string; type: string; description: string }[];
}

export default function Flowchart() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: workflow, isLoading, error } = useWorkflow(id || null);

  // 从 localStorage 读取数据契约
  const [contracts, setContracts] = useState<StepContract[]>([]);

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem(`contracts_${id}`);
      if (stored) {
        try {
          setContracts(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse contracts:', e);
        }
      }
    }
  }, [id]);

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
          <p className="text-slate-500">加载流程图...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">加载工作流失败</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            返回首页
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
            <p className="text-slate-500 mb-4">该工作流还没有步骤</p>
            <Button onClick={handleEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              添加步骤
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
          contracts={contracts}
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
            返回
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              可视化流程图
            </h1>
            <p className="text-sm text-slate-500">{workflowName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4 mr-2" />
            编辑工作流
          </Button>
        </div>
      </div>
    </header>
  );
}
