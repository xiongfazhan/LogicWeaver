/**
 * WorkflowCard 组件
 * 显示工作流卡片，包含封面图、标题、日期、状态徽章
 * 需求: 1.4 - WHEN a user views a workflow card THEN the System SHALL display the cover image, title, last edited date, and status badge
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkflowSummary } from '@/api/generated/models/WorkflowSummary';

interface WorkflowCardProps {
  workflow: WorkflowSummary;
}

/**
 * 格式化日期为可读格式
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/workflow/${workflow.id}/builder`);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      {/* 封面图区域 */}
      <div className="aspect-video bg-slate-100 relative">
        {workflow.cover_image_url ? (
          <img
            src={workflow.cover_image_url}
            alt={workflow.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-slate-300">📋</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* 标题 */}
        <h3 className="font-semibold text-slate-900 truncate mb-2">
          {workflow.name}
        </h3>

        {/* 日期和状态 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {formatDate(workflow.updated_at)}
          </span>
          <Badge
            variant={workflow.status === 'deployed' ? 'success' : 'secondary'}
          >
            {workflow.status === 'deployed' ? '已部署' : '草稿'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
