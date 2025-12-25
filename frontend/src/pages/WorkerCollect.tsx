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
    ArrowLeft,
    Loader2,
    X,
    Trash2,
    CloudUpload,
    CheckCircle2
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
    notes?: NoteData[];
}

interface NoteData {
    id: string;
    content_type: 'image' | 'voice' | 'video' | 'text';
    content: string;
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

    // 图片预览模态框
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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

            // 为每个任务获取步骤和 notes
            const tasksWithSteps = await Promise.all(
                (tasksData.items || []).map(async (task: any) => {
                    // 获取每个 step 的 notes
                    const stepsWithNotes = await Promise.all(
                        (task.steps || []).map(async (step: any) => {
                            try {
                                const notesRes = await fetch(`${API_BASE}/api/notes/step/${step.id}`);
                                if (notesRes.ok) {
                                    const notesData = await notesRes.json();
                                    return { ...step, notes: notesData.items || [], expanded: false };
                                }
                            } catch { /* ignore */ }
                            return { ...step, notes: [], expanded: false };
                        })
                    );
                    return {
                        ...task,
                        steps: stepsWithNotes,
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

    // 处理文件上传
    const handleFileUpload = async (stepId: string, files: FileList | null) => {
        if (!files || files.length === 0) return;

        setSaving(true);
        try {
            for (const file of Array.from(files)) {
                // 上传文件到后端
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await fetch(`${API_BASE}/api/files/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error('Failed to upload file');
                const uploadData = await uploadRes.json();

                // 确定文件类型
                let contentType = 'image';
                if (file.type.startsWith('audio/')) contentType = 'voice';
                else if (file.type.startsWith('video/')) contentType = 'video';

                // 创建 note 关联到 step
                await fetch(`${API_BASE}/api/notes/step/${stepId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content_type: contentType,
                        content: uploadData.url || uploadData.file_path,
                        created_by: 'worker',
                    }),
                });
            }

            await loadData(); // 重新加载
            alert('文件上传成功！');
        } catch (e) {
            console.error('Failed to upload file:', e);
            alert('上传失败：' + (e instanceof Error ? e.message : '未知错误'));
        } finally {
            setSaving(false);
        }
    };

    // 删除已上传的文件
    const deleteNote = async (noteId: string) => {
        if (!confirm('确定要删除这个文件吗？')) return;

        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/notes/${noteId}`, {
                method: 'DELETE',
            });
            await loadData();
        } catch (e) {
            console.error('Failed to delete note:', e);
            alert('删除失败');
        } finally {
            setSaving(false);
        }
    };

    // 删除任务
    const deleteTask = async (taskId: string) => {
        if (!confirm('确定要删除这个任务？该任务下的所有步骤也会被删除！')) return;

        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/tasks/${taskId}`, {
                method: 'DELETE',
            });
            await loadData();
        } catch (e) {
            console.error('Failed to delete task:', e);
            alert('删除失败');
        } finally {
            setSaving(false);
        }
    };

    // 删除步骤
    const deleteStep = async (stepId: string) => {
        if (!confirm('确定要删除这个步骤？')) return;

        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/steps/${stepId}`, {
                method: 'DELETE',
            });
            await loadData();
        } catch (e) {
            console.error('Failed to delete step:', e);
            alert('删除失败');
        } finally {
            setSaving(false);
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

            {/* 图形化进度条 */}
            {(() => {
                const totalSteps = tasks.reduce((sum, t) => sum + (t.steps?.length || 0), 0);
                const filledSteps = tasks.reduce((sum, t) =>
                    sum + (t.steps?.filter(s => s.context_description || (s.notes && s.notes.length > 0)).length || 0), 0);
                const progress = totalSteps > 0 ? (filledSteps / totalSteps) * 100 : 0;

                return (
                    <div className="bg-white border-b border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className={`h-4 w-4 ${progress === 100 ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span className="text-sm font-medium text-slate-700">
                                    采集进度
                                </span>
                            </div>
                            <span className="text-sm text-slate-500">
                                {filledSteps}/{totalSteps} 步骤已完成
                            </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${progress === 100
                                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                        : 'bg-gradient-to-r from-indigo-400 to-indigo-600'
                                    }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                );
            })()}

            {/* 三级树形结构 */}
            <main className="p-4 pb-32">
                <div className="space-y-2">
                    {tasks.map((task, taskIndex) => (
                        <div key={task.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            {/* 一级：任务 */}
                            <div
                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 group"
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
                                {/* 删除任务按钮 */}
                                <button
                                    className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                    title="删除任务"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* 展开：步骤列表 */}
                            {
                                task.expanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50">
                                        {(task.steps || []).map((step, stepIndex) => (
                                            <div key={step.id} className="border-b border-slate-100 last:border-b-0">
                                                {/* 二级：步骤 */}
                                                <div
                                                    className="flex items-center gap-3 p-3 pl-10 cursor-pointer hover:bg-slate-100 group"
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
                                                    {/* 删除步骤按钮 */}
                                                    <button
                                                        className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                                        onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
                                                        title="删除步骤"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                {/* 展开：三级编辑区域 - 左右布局 */}
                                                {step.expanded && (
                                                    <div className="bg-white p-4 pl-16">
                                                        <div className="flex gap-4">
                                                            {/* 左边：文本输入区域 */}
                                                            <div className="flex-[2]">
                                                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                                                    📝 操作说明
                                                                </label>
                                                                <textarea
                                                                    className="w-full h-40 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
                                                                    placeholder="描述这一步怎么操作..."
                                                                    value={step.context_description || ''}
                                                                    onChange={(e) => updateStepDescription(task.id, step.id, e.target.value)}
                                                                />
                                                            </div>

                                                            {/* 中间：预览区 */}
                                                            <div className="flex-1 min-w-[180px]">
                                                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                                                    👁️ 已上传 {step.notes && step.notes.length > 0 && `(${step.notes.length})`}
                                                                </label>
                                                                <div className="h-40 border border-slate-200 rounded-lg bg-slate-50 p-2 overflow-y-auto">
                                                                    {step.notes && step.notes.length > 0 ? (
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {step.notes.map(note => (
                                                                                <div key={note.id} className="relative group">
                                                                                    {note.content_type === 'image' ? (
                                                                                        <img
                                                                                            src={`${API_BASE}${note.content}`}
                                                                                            alt="uploaded"
                                                                                            className="w-full h-16 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80"
                                                                                            onClick={() => setPreviewImage(`${API_BASE}${note.content}`)}
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="w-full h-16 bg-slate-100 rounded flex items-center justify-center text-2xl">
                                                                                            {note.content_type === 'voice' ? '🎤' : '🎬'}
                                                                                        </div>
                                                                                    )}
                                                                                    {/* 删除按钮 */}
                                                                                    <button
                                                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                                                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </button>
                                                                                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 truncate rounded-b">
                                                                                        {note.content.split('/').pop()}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                                                            暂无文件
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* 右边：上传区域 - 美化版 Dropzone */}
                                                            <div className="w-32">
                                                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                                                    📎 上传
                                                                </label>
                                                                <div className="h-40 border-2 border-dashed border-slate-300 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50 hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-400 hover:scale-[1.02] transition-all duration-200 cursor-pointer flex flex-col items-center justify-center group">
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        id={`file-upload-${step.id}`}
                                                                        accept="image/*,audio/*,video/*"
                                                                        multiple
                                                                        onChange={(e) => handleFileUpload(step.id, e.target.files)}
                                                                    />
                                                                    <label htmlFor={`file-upload-${step.id}`} className="cursor-pointer text-center">
                                                                        <div className="w-12 h-12 mb-2 mx-auto rounded-full bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                                                                            <CloudUpload className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                                                                        </div>
                                                                        <span className="text-xs text-slate-500 group-hover:text-indigo-600">点击上传</span>
                                                                        <p className="text-[10px] text-slate-400 mt-1">图片/音频/视频</p>
                                                                    </label>
                                                                </div>
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
                                )
                            }
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
            </main >

            {/* 底部按钮 */}
            < div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4" >
                <Button
                    className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    填完了，去整理 →
                </Button>
            </div >

            {/* 图片预览模态框 */}
            {
                previewImage && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setPreviewImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                        <img
                            src={previewImage}
                            alt="预览"
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )
            }
        </div >
    );
}
