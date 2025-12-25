/**
 * Flowchart 页面 - 可视化流程图
 * 需求: 9.1, 9.2, 9.3, 9.4
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Loader2 } from 'lucide-react';
import { Button } from '../components/ui';
import { FlowCanvas } from '../components/flowchart';
import { useWorkflow } from '../hooks';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** 任务数据类型 */
interface TaskData {
  id: string;
  name: string;
  task_order: number;
  steps: StepData[];
}

/** 步骤数据类型 */
interface StepData {
  id: string;
  name: string;
  step_order: number;
  status: string;
  context_image_url?: string;
}

/** AI 分析结果类型 */
interface AnalysisResponse {
  step_id: string;
  result: {
    contract: StepContract;
  };
}

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

  const { data: workflow, isLoading: workflowLoading, error } = useWorkflow(id || null);

  // 从 Tasks API 加载任务数据
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // 从 localStorage 读取 AI 分析结果
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse[]>([]);

  useEffect(() => {
    if (!id) return;

    // 加载任务数据
    const loadTasks = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tasks/workflow/${id}`);
        if (res.ok) {
          const data = await res.json();
          const loadedTasks: TaskData[] = (data.items || []).map((t: TaskData) => ({
            id: t.id,
            name: t.name,
            task_order: t.task_order,
            steps: (t.steps || []).sort((a: StepData, b: StepData) => a.step_order - b.step_order),
          }));
          loadedTasks.sort((a, b) => a.task_order - b.task_order);
          setTasks(loadedTasks);
        }
      } catch (e) {
        console.error('Failed to load tasks:', e);
      } finally {
        setTasksLoading(false);
      }
    };

    // 读取 AI 分析结果
    const stored = localStorage.getItem(`contracts_${id}`);
    if (stored) {
      try {
        setAnalysisResults(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse contracts:', e);
      }
    }

    loadTasks();
  }, [id]);

  // 返回 Review 页面
  const handleBack = () => {
    navigate(`/workflow/${id}/review`);
  };

  // 返回 Worker 页面编辑
  const handleEdit = () => {
    navigate(`/workflow/${id}/worker`);
  };

  // 加载状态
  const isLoading = workflowLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
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

  // 空工作流状态（无任务或步骤）
  const totalSteps = tasks.reduce((sum, t) => sum + t.steps.length, 0);
  if (tasks.length === 0 || totalSteps === 0) {
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
          tasks={tasks}
          analysisResults={analysisResults}
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
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'}>
            返回仪表盘
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4 mr-2" />
            编辑工作流
          </Button>
        </div>
      </div>
    </header>
  );
}
