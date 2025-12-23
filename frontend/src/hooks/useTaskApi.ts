/**
 * Task API hooks - 连接后端任务 API
 */
import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 类型定义
export interface TaskData {
    id: string;
    workflow_id: string;
    name: string;
    task_order: number;
    description: string | null;
    status: string;
    steps_count: number;
}

export interface StepData {
    id: string;
    task_id: string;
    name: string;
    step_order: number;
    description: string;
    expert_notes: string;
    notes: NoteData[];
}

export interface NoteData {
    id: string;
    step_id: string;
    content_type: 'image' | 'voice' | 'video' | 'text';
    content: string;
    voice_transcript: string | null;
    created_by: string;
}

// 获取工作流的任务列表
export function useTasks(workflowId: string | undefined) {
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        if (!workflowId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/tasks/workflow/${workflowId}`);
            if (!res.ok) throw new Error('Failed to fetch tasks');
            const data = await res.json();
            setTasks(data.items || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [workflowId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const createTask = async (name: string, description?: string) => {
        if (!workflowId) return null;

        try {
            const res = await fetch(`${API_BASE}/api/tasks/workflow/${workflowId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) throw new Error('Failed to create task');
            const task = await res.json();
            setTasks([...tasks, task]);
            return task;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        }
    };

    const updateTask = async (taskId: string, data: { name?: string; description?: string; status?: string }) => {
        try {
            const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update task');
            const updated = await res.json();
            setTasks(tasks.map(t => t.id === taskId ? updated : t));
            return updated;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete task');
            setTasks(tasks.filter(t => t.id !== taskId));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return false;
        }
    };

    return { tasks, loading, error, refetch: fetchTasks, createTask, updateTask, deleteTask };
}

// 获取步骤的笔记列表
export function useNotes(stepId: string | undefined) {
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotes = useCallback(async () => {
        if (!stepId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/notes/step/${stepId}`);
            if (!res.ok) throw new Error('Failed to fetch notes');
            const data = await res.json();
            setNotes(data.items || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [stepId]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const createNote = async (contentType: string, content: string, voiceTranscript?: string) => {
        if (!stepId) return null;

        try {
            const res = await fetch(`${API_BASE}/api/notes/step/${stepId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content_type: contentType,
                    content,
                    voice_transcript: voiceTranscript,
                    created_by: 'worker'
                }),
            });
            if (!res.ok) throw new Error('Failed to create note');
            const note = await res.json();
            setNotes([...notes, note]);
            return note;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        }
    };

    const deleteNote = async (noteId: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/notes/${noteId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete note');
            setNotes(notes.filter(n => n.id !== noteId));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return false;
        }
    };

    return { notes, loading, error, refetch: fetchNotes, createNote, deleteNote };
}

// 更新步骤（包括描述和专家备注）
export async function updateStep(stepId: string, data: { context_description?: string; expert_notes?: string }) {
    try {
        const res = await fetch(`${API_BASE}/api/steps/${stepId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update step');
        return await res.json();
    } catch (err) {
        console.error('Failed to update step:', err);
        return null;
    }
}
