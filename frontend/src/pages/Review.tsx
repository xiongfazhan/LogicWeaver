/**
 * Review 页面 - 业务验收模式
 * 核心用户：业务专家（老师傅）
 * 核心任务：确认 AI 理解是否正确，不对就回去改
 */
import { useState, useEffect } from 'react';
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
import type { StepContract, DataField } from '@/hooks/useAnalysis';
import type { WorkflowStepResponse } from '@/api/generated/models/WorkflowStepResponse';

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

  // 从 localStorage 读取分析结果
  const [contracts, setContracts] = useState<StepContract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  // 每个步骤的确认状态
  const [confirmedSteps, setConfirmedSteps] = useState<Set<number>>(new Set());

  // 技术视图开关
  const [showTechView, setShowTechView] = useState(false);

  // 图片预览
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  // 确认步骤
  const handleConfirmStep = (stepIndex: number) => {
    const newConfirmed = new Set(confirmedSteps);
    newConfirmed.add(stepIndex);
    setConfirmedSteps(newConfirmed);
    localStorage.setItem(`confirmed_${id}`, JSON.stringify([...newConfirmed]));
  };

  // 取消确认
  const handleUnconfirmStep = (stepIndex: number) => {
    const newConfirmed = new Set(confirmedSteps);
    newConfirmed.delete(stepIndex);
    setConfirmedSteps(newConfirmed);
    localStorage.setItem(`confirmed_${id}`, JSON.stringify([...newConfirmed]));
  };

  // 去修改步骤
  const handleEditStep = (stepIndex: number) => {
    // 跳转到 Builder 页面对应步骤
    navigate(`/workflow/${id}/builder?step=${stepIndex}`);
  };

  // 生成流程图
  const handleGenerateFlowchart = () => {
    const allConfirmed = contracts.length > 0 && contracts.every((_, i) => confirmedSteps.has(i));
    if (!allConfirmed) {
      // 找到第一个未确认的步骤并高亮
      const firstUnconfirmed = contracts.findIndex((_, i) => !confirmedSteps.has(i));
      if (firstUnconfirmed >= 0) {
        const element = document.getElementById(`step-${firstUnconfirmed}`);
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

  // 是否全部确认
  const allConfirmed = contracts.length > 0 && contracts.every((_, i) => confirmedSteps.has(i));
  const confirmedCount = confirmedSteps.size;

  // 加载状态
  if (workflowLoading || contractsLoading) {
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

  const steps = workflow?.steps || [];

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
              to={`/workflow/${id}/builder`}
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

          {/* 技术视图开关 */}
          <button
            onClick={() => setShowTechView(!showTechView)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            {showTechView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showTechView ? '隐藏技术参数' : '显示技术参数'}
          </button>
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
            {confirmedCount}/{contracts.length} 已确认
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

      {/* Step Rows */}
      <div className="divide-y divide-slate-200">
        {steps.map((step, index) => {
          const contract = contracts[index];
          const isConfirmed = confirmedSteps.has(index);
          return (
            <div
              key={step.id}
              id={`step-${index}`}
              className={`grid grid-cols-2 min-h-[200px] transition-all ${isConfirmed ? 'bg-emerald-50/30' : ''
                }`}
            >
              {/* Left - 用户描述 */}
              <div className="bg-slate-100 p-4 border-r border-slate-200">
                <SourceCard step={step} index={index} onImageClick={setPreviewImage} />
              </div>

              {/* Right - AI 理解 */}
              <div className="bg-white p-4">
                {contract ? (
                  <AIUnderstandingCard
                    contract={contract}
                    index={index}
                    isConfirmed={isConfirmed}
                    showTechView={showTechView}
                    onConfirm={() => handleConfirmStep(index)}
                    onUnconfirm={() => handleUnconfirmStep(index)}
                    onEdit={() => handleEditStep(index)}
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
                还有 {contracts.length - confirmedCount} 个步骤待确认
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
  step: WorkflowStepResponse;
  index: number;
  onImageClick: (url: string) => void;
}

function SourceCard({ step, index, onImageClick }: SourceCardProps) {
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
        {/* 图片 */}
        {step.context_image_url && (
          <div
            className="relative group cursor-pointer"
            onClick={() => onImageClick(step.context_image_url!)}
          >
            <img
              src={step.context_image_url}
              alt="Context"
              className="w-full h-32 object-cover rounded-lg border border-slate-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}

        {/* 描述 */}
        {step.context_description && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-sm text-slate-700">{step.context_description}</p>
          </div>
        )}

        {/* 文本材料 */}
        {step.context_text_content && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">📄 文本材料</p>
            <p className="text-sm text-slate-700">{step.context_text_content}</p>
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
          <code className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {field.name}: {field.type}
          </code>
        )}
      </div>
    </div>
  );
}
