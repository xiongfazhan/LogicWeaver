/**
 * ContractPanel 组件 - 显示 Data Flow Specification（数据契约）
 * 展示 AI 分析生成的 inputs/outputs 数据流定义
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StepContract, DataField } from '@/hooks/useAnalysis';
import {
    ArrowDown,
    ArrowRight,
    CheckCircle,
    FileInput,
    FileOutput,
    Target,
    MessageSquare,
    Loader2
} from 'lucide-react';

interface ContractPanelProps {
    contracts: StepContract[];
    isLoading?: boolean;
    error?: string | null;
}

export function ContractPanel({ contracts, isLoading, error }: ContractPanelProps) {
    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-slate-500">加载数据契约...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-rose-500">{error}</p>
            </div>
        );
    }

    if (!contracts || contracts.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-slate-500">暂无数据契约，请先完成 AI 分析</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">📋 Data Flow Specification</h2>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {contracts.length} 个步骤
                </Badge>
            </div>

            {contracts.map((contract, index) => (
                <div key={contract.step_id}>
                    <StepContractCard contract={contract} index={index} />
                    {index < contracts.length - 1 && (
                        <div className="flex justify-center py-2">
                            <ArrowDown className="h-6 w-6 text-slate-300" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

interface StepContractCardProps {
    contract: StepContract;
    index: number;
}

function StepContractCard({ contract, index }: StepContractCardProps) {
    return (
        <Card className="bg-white border-slate-200 border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        步骤 {index + 1}: {contract.step_name}
                    </CardTitle>
                </div>
                <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-500" />
                    {contract.business_intent}
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Inputs */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <FileInput className="h-4 w-4 text-blue-500" />
                        <span>输入 (Inputs)</span>
                    </div>
                    {contract.inputs.length === 0 ? (
                        <p className="text-sm text-slate-400 italic pl-6">无输入（首步骤）</p>
                    ) : (
                        <div className="space-y-2 pl-6">
                            {contract.inputs.map((field, idx) => (
                                <DataFieldBadge key={idx} field={field} type="input" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Data Flow Arrow */}
                <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="h-px w-16 bg-slate-200" />
                        <ArrowRight className="h-5 w-5" />
                        <span className="text-xs">处理</span>
                        <ArrowRight className="h-5 w-5" />
                        <div className="h-px w-16 bg-slate-200" />
                    </div>
                </div>

                {/* Outputs */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <FileOutput className="h-4 w-4 text-emerald-500" />
                        <span>输出 (Outputs)</span>
                    </div>
                    {contract.outputs.length === 0 ? (
                        <p className="text-sm text-slate-400 italic pl-6">无输出</p>
                    ) : (
                        <div className="space-y-2 pl-6">
                            {contract.outputs.map((field, idx) => (
                                <DataFieldBadge key={idx} field={field} type="output" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Acceptance Criteria */}
                {contract.acceptance_criteria && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <CheckCircle className="h-4 w-4 text-amber-500" />
                            <span>验收标准</span>
                        </div>
                        <p className="text-sm text-slate-600 pl-6 italic">
                            "{contract.acceptance_criteria}"
                        </p>
                    </div>
                )}

                {/* Notes */}
                {contract.notes && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <MessageSquare className="h-4 w-4 text-slate-400" />
                            <span>备注</span>
                        </div>
                        <p className="text-sm text-slate-500 pl-6">
                            {contract.notes}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface DataFieldBadgeProps {
    field: DataField;
    type: 'input' | 'output';
}

function DataFieldBadge({ field, type }: DataFieldBadgeProps) {
    const colorClass = type === 'input'
        ? 'bg-blue-50 border-blue-200 text-blue-700'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700';

    return (
        <div className={`p-3 rounded-lg border ${colorClass}`}>
            <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-mono font-semibold">{field.name}</code>
                <Badge variant="outline" className="text-xs">
                    {field.type}
                </Badge>
                {!field.required && (
                    <Badge variant="outline" className="text-xs bg-slate-100">
                        可选
                    </Badge>
                )}
            </div>
            <p className="text-sm opacity-80">{field.description}</p>
            {field.example && (
                <p className="text-xs mt-1 opacity-60">
                    示例: <code className="bg-white/50 px-1 rounded">{field.example}</code>
                </p>
            )}
        </div>
    );
}
