/**
 * TemplateSelectModal 组件 - 模板选择弹窗
 * 让用户从预置模板创建工作流
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateWorkflow } from '@/hooks/useWorkflows';

interface TemplateTask {
    name: string;
    steps_count: number;
}

interface Template {
    id: string;
    name: string;
    description: string | null;
    cover_image_url: string | null;
    tasks: TemplateTask[];
}

interface TemplateSelectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// 模拟模板数据（后续从 API 获取）
const MOCK_TEMPLATES: Template[] = [
    {
        id: '1',
        name: '日常巡检',
        description: '适用于设备巡检、安全检查等场景',
        cover_image_url: null,
        tasks: [
            { name: '现场记录', steps_count: 2 },
            { name: '数据采集', steps_count: 2 },
            { name: '结果填报', steps_count: 2 },
        ],
    },
    {
        id: '2',
        name: '质量检测',
        description: '适用于产品质检、来料检验等场景',
        cover_image_url: null,
        tasks: [
            { name: '外观检查', steps_count: 2 },
            { name: '尺寸测量', steps_count: 2 },
            { name: '功能测试', steps_count: 2 },
        ],
    },
    {
        id: '3',
        name: '客服工单',
        description: '适用于客户咨询、投诉处理等场景',
        cover_image_url: null,
        tasks: [
            { name: '信息收集', steps_count: 2 },
            { name: '问题分析', steps_count: 2 },
            { name: '解决处理', steps_count: 2 },
        ],
    },
];

export function TemplateSelectModal({ open, onOpenChange }: TemplateSelectModalProps) {
    const navigate = useNavigate();
    const createWorkflow = useCreateWorkflow();
    const [step, setStep] = useState<'select' | 'name'>('select');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [workflowName, setWorkflowName] = useState('');

    const handleSelectTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setWorkflowName(template.name);
        setStep('name');
    };

    const handleCreateWorkflow = async () => {
        if (!selectedTemplate || !workflowName.trim()) return;

        try {
            // 调用 API 创建工作流
            const workflow = await createWorkflow.mutateAsync({
                name: workflowName.trim(),
                description: selectedTemplate.description || undefined,
            });

            onOpenChange(false);
            navigate(`/workflow/${workflow.id}/worker`);
        } catch (error) {
            console.error('Failed to create workflow:', error);
        }
    };

    const handleClose = () => {
        setStep('select');
        setSelectedTemplate(null);
        setWorkflowName('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                {step === 'select' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>选择工作流模板</DialogTitle>
                            <DialogDescription>
                                选择一个模板快速开始，或者从空白开始创建
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* 空白模板 */}
                            <Card
                                className="cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all"
                                onClick={async () => {
                                    try {
                                        const workflow = await createWorkflow.mutateAsync({
                                            name: `新工作流 ${new Date().toLocaleDateString('zh-CN')}`,
                                        });
                                        onOpenChange(false);
                                        navigate(`/workflow/${workflow.id}/worker`);
                                    } catch (error) {
                                        console.error('Failed to create workflow:', error);
                                    }
                                }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900">空白工作流</h3>
                                            <p className="text-xs text-slate-500">从零开始</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 预置模板 */}
                            {MOCK_TEMPLATES.map((template) => (
                                <Card
                                    key={template.id}
                                    className="cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all"
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <span className="text-lg">📋</span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-900">{template.name}</h3>
                                                <p className="text-xs text-slate-500">{template.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {template.tasks.map((task, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {task.name} ({task.steps_count}步)
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>命名您的工作流</DialogTitle>
                            <DialogDescription>
                                基于 "{selectedTemplate?.name}" 模板创建
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    工作流名称
                                </label>
                                <Input
                                    value={workflowName}
                                    onChange={(e) => setWorkflowName(e.target.value)}
                                    placeholder="请输入工作流名称"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('select')}
                                >
                                    返回
                                </Button>
                                <Button
                                    onClick={handleCreateWorkflow}
                                    disabled={!workflowName.trim() || createWorkflow.isPending}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {createWorkflow.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            创建中...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            创建工作流
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
