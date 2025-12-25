/**
 * Review 页面 - 业务验收模式
 * 核心用户：业务专家（老师傅）
 * 核心任务：确认 AI 理解是否正确，不对就回去改
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkflow } from '@/hooks/useWorkflows';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  ArrowRight,
  CheckCircle,
  Edit3,
  X,
  ZoomIn,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import type { StepContract, DataField, AnalysisResponse } from '@/hooks/useAnalysis';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 步骤数据类型（从 Tasks API 获取）
interface StepData {
  id: string;
  name: string;
  step_order: number;
  context_description: string;
  expert_notes: string;
  status: string;
  context_image_url?: string;
  context_text_content?: string;
  notes?: Array<{
    id: string;
    content_type: string;
    content: string;
  }>;
}

interface TaskData {
  id: string;
  name: string;
  task_order: number;
  steps: StepData[];
}

// 类型映射：技术类型 → 中文
const TYPE_MAP: Record<string, string> = {
  'string': '文本',
  'int': '数字',
  'float': '小数',
  'bool': '是/否',
  'image': '图片',
  'file': '文件',
  'list[string]': '文本列表',
  'dict': '数据对象',
};

function getChineseType(type: string): string {
  return TYPE_MAP[type] || type;
}

export default function Review() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 获取工作流数据
  const { data: workflow, isLoading: workflowLoading, error: workflowError } = useWorkflow(id || null);

  // 从 Tasks API 加载任务和步骤数据
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [stepsLoading, setStepsLoading] = useState(true);

  // 从 tasks 派生所有步骤（用于统计和 step_id 查找）
  const steps = useMemo(() => {
    const allSteps: StepData[] = [];
    for (const task of tasks) {
      for (const step of task.steps || []) {
        allSteps.push(step);
      }
    }
    return allSteps;
  }, [tasks]);

  // 从 localStorage 读取分析结果（完整的 AnalysisResponse，包含 step_id）
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  // 每个步骤的确认状态（用 step.id 而不是索引）
  const [confirmedSteps, setConfirmedSteps] = useState<Set<string>>(new Set());

  // 技术视图开关
  const [showTechView, setShowTechView] = useState(false);

  // 图片预览
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 加载任务和步骤数据
  const loadTasks = useCallback(async () => {
    if (!id) return;

    try {
      // 从 Tasks API 获取任务
      const tasksRes = await fetch(`${API_BASE}/api/tasks/workflow/${id}`);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const loadedTasks: TaskData[] = [];

        for (const task of (tasksData.items || [])) {
          const taskWithNotes: TaskData = {
            id: task.id,
            name: task.name,
            task_order: task.task_order,
            steps: [],
          };

          // 加载每个步骤的 notes
          for (const step of (task.steps || [])) {
            try {
              const notesRes = await fetch(`${API_BASE}/api/notes/step/${step.id}`);
              if (notesRes.ok) {
                const notesData = await notesRes.json();
                step.notes = notesData.items || [];
              }
            } catch { }
            taskWithNotes.steps.push(step);
          }

          // 按 step_order 排序步骤
          taskWithNotes.steps.sort((a: StepData, b: StepData) => a.step_order - b.step_order);
          loadedTasks.push(taskWithNotes);
        }

        // 按 task_order 排序任务
        loadedTasks.sort((a, b) => a.task_order - b.task_order);
        setTasks(loadedTasks);
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setStepsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem(`contracts_${id}`);
      if (stored) {
        try {
          setAnalysisResults(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse contracts:', e);
        }
      }
      // 读取已确认的步骤
      const confirmed = localStorage.getItem(`confirmed_${id}`);
      if (confirmed) {
        try {
          setConfirmedSteps(new Set(JSON.parse(confirmed)));
        } catch (e) {
          console.error('Failed to parse confirmed steps:', e);
        }
      }
      setContractsLoading(false);
    }
  }, [id]);

  // 确认/取消确认步骤（使用 step.id）
  const handleConfirmStep = (stepId: string) => {
    setConfirmedSteps(prev => {
      const next = new Set(prev);
      next.add(stepId);
      localStorage.setItem(`confirmed_${id}`, JSON.stringify([...next]));
      return next;
    });
  };

  const handleUnconfirmStep = (stepId: string) => {
    setConfirmedSteps(prev => {
      const next = new Set(prev);
      next.delete(stepId);
      localStorage.setItem(`confirmed_${id}`, JSON.stringify([...next]));
      return next;
    });
  };

  // 去修改步骤
  const handleEditStep = (stepIndex: number) => {
    // 跳转到 Builder 页面对应步骤
    navigate(`/workflow/${id}/worker?step=${stepIndex}`);
  };

  // 生成流程图
  const handleGenerateFlowchart = () => {
    // 检查所有有分析结果的步骤是否都已确认
    const stepsWithResult = steps.filter(s => analysisResults.some(r => r.step_id === s.id));
    const allConfirmed = stepsWithResult.length > 0 && stepsWithResult.every(s => confirmedSteps.has(s.id));

    if (!allConfirmed) {
      // 找到第一个未确认的步骤并高亮
      const firstUnconfirmed = stepsWithResult.find(s => !confirmedSteps.has(s.id));
      if (firstUnconfirmed) {
        const stepIndex = steps.findIndex(s => s.id === firstUnconfirmed.id);
        const element = document.getElementById(`step-${stepIndex}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.classList.add('ring-2', 'ring-amber-500', 'ring-offset-2');
        setTimeout(() => {
          element?.classList.remove('ring-2', 'ring-amber-500', 'ring-offset-2');
        }, 2000);
      }
      return;
    }
    navigate(`/workflow/${id}/flowchart`);
  };

  // 统计信息
  const stepsWithResult = steps.filter(s => analysisResults.some(r => r.step_id === s.id));
  const allConfirmed = stepsWithResult.length > 0 && stepsWithResult.every(s => confirmedSteps.has(s.id));
  const confirmedCount = stepsWithResult.filter(s => confirmedSteps.has(s.id)).length;

  // 加载状态
  if (workflowLoading || contractsLoading || stepsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-slate-500">加载数据...</span>
      </div>
    );
  }

  // 错误状态
  if (workflowError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <p className="text-rose-500 mb-4">加载工作流失败</p>
        <Link to="/" className="text-indigo-600 hover:underline">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 图片预览弹窗 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/workflow/${id}/worker`}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回编辑</span>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                业务逻辑复核
              </h1>
              <p className="text-sm text-slate-500">{workflow?.name}</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              返回仪表盘
            </button>
            <button
              onClick={() => setShowTechView(!showTechView)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              {showTechView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showTechView ? '隐藏技术参数' : '显示技术参数'}
            </button>
          </div>
        </div>
      </header>

      {/* 进度提示 */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <p className="text-sm text-slate-600">
            请确认每一步的 AI 理解是否正确。
            <span className="text-slate-400 ml-2">确认无误请点击"逻辑正确"，有问题请点击"去修改"</span>
          </p>
          <Badge
            variant={allConfirmed ? 'success' : 'secondary'}
            className="text-sm"
          >
            {confirmedCount}/{stepsWithResult.length} 已确认
          </Badge>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 sticky top-[117px] z-10">
        <div className="px-6 py-3 border-r border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">📝 您的描述</h2>
        </div>
        <div className="px-6 py-3">
          <h2 className="text-sm font-semibold text-slate-600">🤖 AI 的理解</h2>
        </div>
      </div>

      {/* Task Groups with Steps */}
      <div className="divide-y divide-slate-300">
        {tasks.map((task, taskIndex) => (
          <div key={task.id} className="bg-white">
            {/* Task Header */}
            <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-3 sticky top-[117px] z-10">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold">
                  {taskIndex + 1}
                </span>
                <h3 className="text-lg font-semibold text-indigo-900">{task.name}</h3>
                <span className="text-sm text-indigo-500 ml-auto">
                  {task.steps.length} 个步骤
                </span>
              </div>
            </div>

            {/* Steps in this Task */}
            <div className="divide-y divide-slate-200">
              {task.steps.map((step, stepIndex) => {
                // 用 step_id 查找对应的分析结果
                const analysisResult = analysisResults.find(r => r.step_id === step.id);
                const contract = analysisResult?.result.contract;
                const isConfirmed = confirmedSteps.has(step.id);
                // 计算全局步骤索引（用于编辑跳转）
                const globalIndex = steps.findIndex(s => s.id === step.id);
                return (
                  <div
                    key={step.id}
                    id={`step-${task.id}-${stepIndex}`}
                    className={`grid grid-cols-2 min-h-[200px] transition-all ${isConfirmed
                      ? 'bg-emerald-50 ring-2 ring-emerald-500 ring-inset'
                      : ''
                      }`}
                  >
                    {/* Left - 用户描述 (深色背景模拟草稿质感) */}
                    <div className="bg-slate-200/80 p-4 border-r border-slate-300">
                      <SourceCard step={step} index={stepIndex} onImageClick={setPreviewImage} />
                    </div>

                    {/* Right - AI 理解 */}
                    <div className="bg-white p-4">
                      {contract ? (
                        <AIUnderstandingCard
                          contract={contract}
                          index={stepIndex}
                          isConfirmed={isConfirmed}
                          showTechView={showTechView}
                          onConfirm={() => handleConfirmStep(step.id)}
                          onUnconfirm={() => handleUnconfirmStep(step.id)}
                          onEdit={() => handleEditStep(globalIndex)}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                          暂无 AI 分析结果
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="text-sm text-slate-500">
            {allConfirmed ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                所有步骤已确认，可以生成流程图
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                还有 {stepsWithResult.length - confirmedCount} 个步骤待确认
              </span>
            )}
          </div>
          <Button
            onClick={handleGenerateFlowchart}
            className={`px-6 ${allConfirmed ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
            disabled={!allConfirmed}
          >
            生成流程图 →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 用户描述卡片
// ============================================================================

interface SourceCardProps {
  step: StepData;
  index: number;
  onImageClick: (url: string) => void;
}

function SourceCard({ step, index, onImageClick }: SourceCardProps) {
  // 获取图片类型的 notes
  const imageNotes = step.notes?.filter(n => n.content_type === 'image') || [];

  return (
    <Card className="bg-white h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-slate-900">
            步骤 {index + 1}: {step.name}
          </h3>
          <Badge variant={step.status === 'completed' ? 'success' : 'secondary'} className="text-xs">
            {step.status === 'completed' ? '已采集' : '进行中'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 描述 */}
        {step.context_description && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-sm text-slate-700">{step.context_description}</p>
          </div>
        )}

        {/* 专家备注 */}
        {step.expert_notes && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-600 mb-1">✨ 备注</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{step.expert_notes}</p>
          </div>
        )}

        {/* 图片素材 - 从 notes 中获取 */}
        {imageNotes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">📷 图片素材</p>
            <div className="grid grid-cols-2 gap-2">
              {imageNotes.map((note) => {
                const imgUrl = note.content.startsWith('http')
                  ? note.content
                  : `${API_BASE}${note.content}`;
                return (
                  <div
                    key={note.id}
                    className="relative group cursor-pointer"
                    onClick={() => onImageClick(imgUrl)}
                  >
                    <img
                      src={imgUrl}
                      alt="素材"
                      className="w-full h-24 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 无内容提示 */}
        {!step.context_description && !step.expert_notes && imageNotes.length === 0 && (
          <div className="text-center py-4 text-slate-400 text-sm">
            暂无采集内容
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// AI 理解卡片（业务视角）
// ============================================================================

interface AIUnderstandingCardProps {
  contract: StepContract;
  index: number;
  isConfirmed: boolean;
  showTechView: boolean;
  onConfirm: () => void;
  onUnconfirm: () => void;
  onEdit: () => void;
}

function AIUnderstandingCard({
  contract,
  isConfirmed,
  showTechView,
  onConfirm,
  onUnconfirm,
  onEdit
}: AIUnderstandingCardProps) {
  return (
    <Card className={`h-full transition-all ${isConfirmed
      ? 'border-emerald-300 bg-emerald-50/50'
      : 'border-slate-200'
      }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
            {isConfirmed && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            AI 的理解
          </h3>
          <button
            onClick={onEdit}
            className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1"
          >
            <Edit3 className="h-4 w-4" />
            理解错了？去修改
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 业务意图 - 最重要 */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <p className="text-sm text-indigo-600 mb-1">⚙️ 这一步做什么</p>
          <p className="text-base font-medium text-slate-800">
            {contract.business_intent}
          </p>
        </div>

        {/* 输入 */}
        <div>
          <p className="text-sm text-slate-500 mb-2">📥 需要什么</p>
          {contract.inputs.length === 0 ? (
            <p className="text-sm text-slate-400 italic">（这是第一步，不需要输入）</p>
          ) : (
            <div className="space-y-2">
              {contract.inputs.map((field, i) => (
                <FieldDisplay key={i} field={field} showTech={showTechView} />
              ))}
            </div>
          )}
        </div>

        {/* 箭头 */}
        <div className="flex items-center justify-center">
          <ArrowRight className="h-5 w-5 text-slate-300" />
        </div>

        {/* 输出 */}
        <div>
          <p className="text-sm text-slate-500 mb-2">📤 产出什么</p>
          {contract.outputs.length === 0 ? (
            <p className="text-sm text-slate-400 italic">（无输出）</p>
          ) : (
            <div className="space-y-2">
              {contract.outputs.map((field, i) => (
                <FieldDisplay key={i} field={field} showTech={showTechView} />
              ))}
            </div>
          )}
        </div>

        {/* 验收标准 */}
        {contract.acceptance_criteria && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-700">
              ✅ 怎样算做好了：{contract.acceptance_criteria}
            </p>
          </div>
        )}

        {/* 确认按钮 */}
        <div className="pt-4 border-t border-slate-100">
          {isConfirmed ? (
            <button
              onClick={onUnconfirm}
              className="w-full py-3 rounded-lg border-2 border-emerald-300 bg-emerald-50 text-emerald-700 font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              已确认准确（点击取消）
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              逻辑正确，通过
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 字段显示组件
// ============================================================================

interface FieldDisplayProps {
  field: DataField;
  showTech: boolean;
}

function FieldDisplay({ field, showTech }: FieldDisplayProps) {
  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">
            {field.description || field.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            类型：{getChineseType(field.type)}
          </p>
        </div>
        {showTech && (
          <code className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded font-mono-tech">
            {field.name}: {field.type}
          </code>
        )}
      </div>
    </div>
  );
}
