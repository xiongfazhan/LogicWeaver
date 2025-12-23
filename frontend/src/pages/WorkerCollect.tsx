/**
 * WorkerCollect 页面 - 工人采集入口
 * 核心功能：可伸缩的三级树形结构（任务→步骤→记录）
 * 数据存储：调用后端 API 保存到数据库
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Plus,
    ChevronRight,
    ChevronDown,
    Camera,
    Mic,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    expanded?: boolean;
}

interface StepData {
    id: string;
    task_id: string;
    name: string;
    step_order: number;
    context_description: string;
    expert_notes: string;
    status: string;
    expanded?: boolean;
}

interface WorkflowInfo {
    id: string;
    name: string;
}

export default function WorkerCollect() {
    const { id: workflowId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [workflow, setWorkflow] = useState<WorkflowInfo | null>(null);
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 新任务/步骤输入
    const [addingTaskId, setAddingTaskId] = useState<string | null>(null);
    const [addingStepTaskId, setAddingStepTaskId] = useState<string | null>(null); // 正在添加步骤的任务ID
    const [newItemName, setNewItemName] = useState('');

    // 加载工作流和任务数据
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

            // 为每个任务获取步骤
            const tasksWithSteps = await Promise.all(
                (tasksData.items || []).map(async (task: any) => {
                    // 假设后端返回的 task 已经包含 steps 信息
                    // 如果不包含，需要单独获取
                    return {
                        ...task,
                        steps: task.steps || [],
                        expanded: true,
                    };
                })
            );

            setTasks(tasksWithSteps);
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

    // 展开/收起任务
    const toggleTask = (taskId: string) => {
        setTasks(tasks.map(t =>
            t.id === taskId ? { ...t, expanded: !t.expanded } : t
        ));
    };

    // 展开/收起步骤
    const toggleStep = (taskId: string, stepId: string) => {
        setTasks(tasks.map(t =>
            t.id === taskId
                ? {
                    ...t, steps: t.steps.map(s =>
                        s.id === stepId ? { ...s, expanded: !s.expanded } : s
                    )
                }
                : t
        ));
    };

    // 更新步骤描述 (调用后端 API)
    const updateStepDescription = async (taskId: string, stepId: string, desc: string) => {
        // 先更新本地状态
        setTasks(tasks.map(t =>
            t.id === taskId
                ? {
                    ...t, steps: t.steps.map(s =>
                        s.id === stepId ? { ...s, context_description: desc } : s
                    )
                }
                : t
        ));

        // 调用后端 API 保存（防抖可以后续添加）
        try {
            await fetch(`${API_BASE}/api/steps/${stepId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context_description: desc }),
            });
        } catch (e) {
            console.error('Failed to save step description:', e);
        }
    };

    // 添加任务
    const addTask = async () => {
        if (!newItemName.trim() || !workflowId) return;

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/tasks/workflow/${workflowId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newItemName.trim() }),
            });
            if (!res.ok) throw new Error('Failed to create task');

            await loadData(); // 重新加载
            setNewItemName('');
            setAddingTaskId(null);
        } catch (e) {
            console.error('Failed to add task:', e);
        } finally {
            setSaving(false);
        }
    };

    // 添加步骤
    const addStep = async (taskId: string) => {
        if (!newItemName.trim()) return;

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/steps/task/${taskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newItemName.trim(),
                    task_id: taskId,
                }),
            });
            if (!res.ok) throw new Error('Failed to create step');

            await loadData(); // 重新加载
            setNewItemName('');
            setAddingStepTaskId(null);
        } catch (e) {
            console.error('Failed to add step:', e);
        } finally {
            setSaving(false);
        }
    };

    // 提交完成
    const handleSubmit = async () => {
        setSaving(true);
        try {
            // 更新工作流状态为 worker_done
            await fetch(`${API_BASE}/api/status/workflow/${workflowId}/advance`, {
                method: 'POST',
            });
            navigate(`/workflow/${workflowId}/expert`);
        } catch (e) {
            console.error('Failed to submit:', e);
        } finally {
            setSaving(false);
        }
    };

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
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-slate-500">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">📋 {workflow?.name || '工作流'}</h1>
                            <p className="text-sm text-slate-500">点击展开填写详情</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* 三级树形结构 */}
            <main className="p-4 pb-32">
                <div className="space-y-2">
                    {tasks.map((task, taskIndex) => (
                        <div key={task.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            {/* 一级：任务 */}
                            <div
                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50"
                                onClick={() => toggleTask(task.id)}
                            >
                                {task.expanded ? (
                                    <ChevronDown className="h-5 w-5 text-slate-400" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-slate-400" />
                                )}
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                                    {taskIndex + 1}
                                </div>
                                <span className="font-medium text-slate-900">{task.name}</span>
                                <span className="text-xs text-slate-400 ml-auto">
                                    {task.steps?.length || 0} 个步骤
                                </span>
                            </div>

                            {/* 展开：步骤列表 */}
                            {task.expanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50">
                                    {(task.steps || []).map((step, stepIndex) => (
                                        <div key={step.id} className="border-b border-slate-100 last:border-b-0">
                                            {/* 二级：步骤 */}
                                            <div
                                                className="flex items-center gap-3 p-3 pl-10 cursor-pointer hover:bg-slate-100"
                                                onClick={() => toggleStep(task.id, step.id)}
                                            >
                                                {step.expanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                                )}
                                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-medium text-xs">
                                                    {stepIndex + 1}
                                                </div>
                                                <span className="text-slate-800">{step.name}</span>
                                                {step.context_description && (
                                                    <span className="text-xs text-emerald-600 ml-auto">✓ 已填写</span>
                                                )}
                                            </div>

                                            {/* 展开：三级编辑区域 */}
                                            {step.expanded && (
                                                <div className="bg-white p-4 pl-16 space-y-4">
                                                    {/* 文字描述 */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-600 mb-2">
                                                            📝 操作说明
                                                        </label>
                                                        <textarea
                                                            className="w-full h-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
                                                            placeholder="描述这一步怎么操作..."
                                                            value={step.context_description || ''}
                                                            onChange={(e) => updateStepDescription(task.id, step.id, e.target.value)}
                                                        />
                                                    </div>

                                                    {/* 添加资料 */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-600 mb-2">
                                                            📎 添加资料
                                                        </label>
                                                        <div className="flex gap-3">
                                                            <button className="flex-1 h-16 bg-indigo-50 rounded-lg border border-dashed border-indigo-300 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                                                <Camera className="h-5 w-5 text-indigo-600" />
                                                                <span className="text-sm font-medium text-indigo-600">拍照</span>
                                                            </button>
                                                            <button className="flex-1 h-16 bg-emerald-50 rounded-lg border border-dashed border-emerald-300 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                                                                <Mic className="h-5 w-5 text-emerald-600" />
                                                                <span className="text-sm font-medium text-emerald-600">录音</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* 添加步骤 */}
                                    <div className="p-3 pl-10">
                                        {addingStepTaskId === task.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-indigo-400"
                                                    placeholder="步骤名称，如：读取数值"
                                                    value={newItemName}
                                                    onChange={(e) => setNewItemName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addStep(task.id)}
                                                    autoFocus
                                                />
                                                <Button size="sm" onClick={() => addStep(task.id)} disabled={saving}>
                                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '添加'}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => { setAddingStepTaskId(null); setNewItemName(''); }}>取消</Button>
                                            </div>
                                        ) : (
                                            <button
                                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-600"
                                                onClick={(e) => { e.stopPropagation(); setAddingStepTaskId(task.id); setAddingTaskId(null); setNewItemName(''); }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                添加步骤
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* 添加任务 */}
                    {addingTaskId === 'task' ? (
                        <div className="bg-white rounded-lg border-2 border-dashed border-indigo-300 p-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-indigo-400"
                                    placeholder="任务名称，如：抄表"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                    autoFocus
                                />
                                <Button size="sm" onClick={addTask} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '添加'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setAddingTaskId(null); setNewItemName(''); }}>取消</Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                            onClick={() => setAddingTaskId('task')}
                        >
                            <Plus className="h-5 w-5" />
                            添加任务
                        </button>
                    )}

                    {tasks.length === 0 && !addingTaskId && (
                        <div className="text-center py-12 text-slate-400">
                            <p className="mb-2">暂无任务</p>
                            <p className="text-sm">点击上方按钮添加任务</p>
                        </div>
                    )}
                </div>
            </main>

            {/* 底部按钮 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
                <Button
                    className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    填完了，交给专家整理 →
                </Button>
            </div>
        </div>
    );
}
