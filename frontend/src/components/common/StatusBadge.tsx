/**
 * StatusBadge 组件 - 状态徽章
 * 显示工作流当前状态，支持多种状态显示
 */
import { Badge } from '@/components/ui/badge';

// 状态显示配置
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft: {
        label: '草稿',
        className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    },
    worker_done: {
        label: '待整理',
        className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
    expert_done: {
        label: '待AI分析',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    },
    analyzed: {
        label: '待复核',
        className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    },
    confirmed: {
        label: '已确认',
        className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    },
    delivered: {
        label: '已交付',
        className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
    // 兼容旧状态
    deployed: {
        label: '已部署',
        className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || {
        label: status,
        className: 'bg-slate-100 text-slate-700',
    };

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-base px-3 py-1',
    };

    return (
        <Badge className={`${config.className} ${sizeClasses[size]} font-medium`}>
            {config.label}
        </Badge>
    );
}

// 导出状态配置供其他组件使用
export { STATUS_CONFIG };
