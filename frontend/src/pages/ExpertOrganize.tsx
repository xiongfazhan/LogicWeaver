/**
 * ExpertOrganize 页面 - 专家整理入口
 * 核心功能：查看工人素材 + 结构化整理
 * 数据来源：从后端 API 获取工人采集的数据
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    ChevronRight,
    Image as ImageIcon,
    Mic,
    Type,
    Save,
    Eye,
    FileText,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 类型定义
interface TaskData {
    id: string;
    workflow_id: string;
    name: string;
    task_order: number;
    description: string | null;
    status: string;
    steps: StepData[];
}

interface StepData {
    id: string;
    task_id: string;
    name: string;
    step_order: number;
    context_description: string;
    expert_notes: string;
    status: string;
    notes?: NoteData[];
}

interface NoteData {
    id: string;
    content_type: 'image' | 'voice' | 'video' | 'text';
    content: string;
    voice_transcript?: string;
}

interface WorkflowInfo {
    id: string;
    name: string;
}

export default function ExpertOrganize() {
    const { id: workflowId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [workflow, setWorkflow] = useState<WorkflowInfo | null>(null);
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 当前选中的任务/步骤
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    // 加载数据
    const loadData = useCallback(async () => {
        if (!workflowId) return;

        setLoading(true);
        setError(null);
        try {
            // 获取工作流信息
            const wfRes = await fetch(`${API_BASE}/api/workflows/${workflowId}`);
            if (!wfRes.ok) throw new Error('Failed to fetch workflow');
            const wfData = await wfRes.json();
            setWorkflow({ id: wfData.id, name: wfData.name });

            // 获取任务列表
            const tasksRes = await fetch(`${API_BASE}/api/tasks/workflow/${workflowId}`);
            if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
            const tasksData = await tasksRes.json();

            // 获取每个步骤的 notes
            const tasksWithNotes = await Promise.all(
                (tasksData.items || []).map(async (task: TaskData) => {
                    const stepsWithNotes = await Promise.all(
                        (task.steps || []).map(async (step: StepData) => {
                            try {
                                const notesRes = await fetch(`${API_BASE}/api/notes/step/${step.id}`);
                                if (notesRes.ok) {
                                    const notesData = await notesRes.json();
                                    return { ...step, notes: notesData.items || [] };
                                }
                            } catch { }
                            return { ...step, notes: [] };
                        })
                    );
                    return { ...task, steps: stepsWithNotes };
                })
            );

            setTasks(tasksWithNotes);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
            console.error('Failed to load data:', e);
        } finally {
            setLoading(false);
        }
    }, [workflowId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 获取当前选中的数据
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const selectedStep = selectedTask?.steps.find(s => s.id === selectedStepId);

    // 更新专家备注
    const updateExpertNotes = (notes: string) => {
        if (!selectedTaskId || !selectedStepId) return;

        setTasks(tasks.map(t =>
            t.id === selectedTaskId
                ? {
                    ...t,
                    steps: t.steps.map(s =>
                        s.id === selectedStepId
                            ? { ...s, expert_notes: notes }
                            : s
                    )
                }
                : t
        ));
    };

    // 保存专家备注到后端
    const handleSave = async () => {
        if (!selectedStepId || !selectedStep) return;

        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/steps/${selectedStepId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expert_notes: selectedStep.expert_notes }),
            });
            alert('保存成功！');
        } catch (e) {
            console.error('Failed to save:', e);
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    // 提交到 AI 分析
    const handleSubmitToAI = async () => {
        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/status/workflow/${workflowId}/advance`, {
                method: 'POST',
            });
            navigate(`/workflow/${workflowId}/review`);
        } catch (e) {
            console.error('Failed to submit:', e);
        } finally {
            setSaving(false);
        }
    };

    // 计算统计信息
    const totalSteps = tasks.reduce((sum, t) => sum + (t.steps?.length || 0), 0);
    const filledSteps = tasks.reduce((sum, t) =>
        sum + (t.steps || []).filter(s => s.context_description || (s.notes && s.notes.length > 0)).length, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={loadData}>重试</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={`/workflow/${workflowId}/worker`} className="text-slate-500 hover:text-slate-700">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">📝 专家整理模式</h1>
                            <p className="text-sm text-slate-500">{workflow?.name}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => navigate(`/workflow/${workflowId}/review`)}
                    >
                        <Eye className="h-4 w-4" /> 预览效果
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex">
                {/* 左侧：任务列表 */}
                <aside className="w-64 bg-white border-r border-slate-200 p-4">
                    <h2 className="text-sm font-medium text-slate-500 mb-3">任务列表</h2>
                    <div className="space-y-2">
                        {tasks.map((task, taskIndex) => (
                            <div key={task.id}>
                                <button
                                    className={`w-full text-left p-2 rounded flex items-center justify-between text-sm ${selectedTaskId === task.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'
                                        }`}
                                    onClick={() => {
                                        setSelectedTaskId(task.id);
                                        setSelectedStepId(null);
                                    }}
                                >
                                    <span>{taskIndex + 1}. {task.name}</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>

                                {/* 步骤列表 */}
                                {selectedTaskId === task.id && (
                                    <div className="ml-4 mt-1 space-y-1">
                                        {(task.steps || []).map((step, stepIndex) => (
                                            <button
                                                key={step.id}
                                                className={`w-full text-left p-2 rounded flex items-center justify-between text-xs ${selectedStepId === step.id
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'hover:bg-slate-50'
                                                    }`}
                                                onClick={() => setSelectedStepId(step.id)}
                                            >
                                                <span>{stepIndex + 1}. {step.name}</span>
                                                {(step.context_description || (step.notes && step.notes.length > 0)) && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {step.notes?.length || '✓'}
                                                    </Badge>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {tasks.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            暂无数据<br />
                            <Link to={`/workflow/${workflowId}/worker`} className="text-indigo-600 hover:underline">
                                去工人采集页面填写
                            </Link>
                        </div>
                    )}
                </aside>

                {/* 中间：工人记录内容 */}
                <section className="flex-1 p-6 overflow-auto">
                    {selectedStep ? (
                        <div className="max-w-3xl">
                            <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-orange-500">👷</span>
                                工人记录的内容
                            </h2>

                            {/* 工人填写的操作说明 */}
                            {selectedStep.context_description && (
                                <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                                    <h3 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> 操作说明
                                    </h3>
                                    <p className="text-slate-700 whitespace-pre-wrap">{selectedStep.context_description}</p>
                                </div>
                            )}

                            {/* 工人上传的素材 */}
                            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                                <h3 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                                    📎 附件资料
                                </h3>
                                {selectedStep.notes && selectedStep.notes.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedStep.notes.map(note => (
                                            <div key={note.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                                                {note.content_type === 'image' && (
                                                    <>
                                                        <ImageIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                                                        <div>
                                                            <span className="text-sm text-slate-600">📷 图片</span>
                                                            <p className="text-xs text-slate-400 mt-1">{note.content}</p>
                                                        </div>
                                                    </>
                                                )}
                                                {note.content_type === 'voice' && (
                                                    <>
                                                        <Mic className="h-5 w-5 text-green-500 mt-0.5" />
                                                        <div>
                                                            <span className="text-sm text-slate-600">🎤 语音</span>
                                                            {note.voice_transcript && (
                                                                <p className="text-sm text-slate-700 mt-1 italic">
                                                                    "{note.voice_transcript}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                {note.content_type === 'text' && (
                                                    <>
                                                        <Type className="h-5 w-5 text-purple-500 mt-0.5" />
                                                        <div>
                                                            <span className="text-sm text-slate-600">📝 文字</span>
                                                            <p className="text-sm text-slate-700 mt-1">{note.content}</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm">暂无附件</p>
                                )}
                            </div>

                            {/* 无内容提示 */}
                            {!selectedStep.context_description && (!selectedStep.notes || selectedStep.notes.length === 0) && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                    <p className="text-amber-600">⚠️ 工人尚未填写此步骤的内容</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            ← 请从左侧选择一个步骤查看工人记录
                        </div>
                    )}
                </section>

                {/* 右侧：专家整理区 */}
                <aside className="w-80 bg-white border-l border-slate-200 p-4 flex flex-col">
                    <h2 className="text-sm font-medium text-amber-600 mb-3 flex items-center gap-2">
                        <span>✨</span> 专家整理
                    </h2>

                    {selectedStep ? (
                        <>
                            <div className="bg-amber-50 rounded-lg p-3 mb-4">
                                <h3 className="font-medium text-slate-800 text-sm mb-1">
                                    {selectedTask?.name} / {selectedStep.name}
                                </h3>
                                <p className="text-xs text-slate-500">根据工人的记录，整理成规范的操作步骤：</p>
                            </div>

                            <textarea
                                className="flex-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
                                placeholder="1. 第一步操作&#10;2. 第二步操作&#10;3. ..."
                                value={selectedStep.expert_notes || ''}
                                onChange={(e) => updateExpertNotes(e.target.value)}
                            />

                            <Button
                                className="mt-4 w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                保存
                            </Button>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center">
                            选择一个步骤后<br />可以在这里整理专家备注
                        </div>
                    )}
                </aside>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 p-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <span className="text-sm text-slate-500">
                        {tasks.length} 个任务 · {totalSteps} 个步骤 · {filledSteps} 个已填写
                    </span>
                    <Button
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSubmitToAI}
                        disabled={saving}
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        整理完成，交给 AI 分析 →
                    </Button>
                </div>
            </footer>
        </div>
    );
}
