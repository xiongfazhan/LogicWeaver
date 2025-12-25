/**
 * WorkflowCard 组件
 * 显示工作流卡片，包含封面图、标题、日期、状态徽章、操作菜单
 * 需求: 1.4 - WHEN a user views a workflow card THEN the System SHALL display the cover image, title, last edited date, and status badge
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, GitBranch, FileText } from 'lucide-react';
import type { WorkflowSummary } from '@/api/generated/models/WorkflowSummary';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface WorkflowCardProps {
  workflow: WorkflowSummary;
  onRefresh?: () => void;
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

export function WorkflowCard({ workflow, onRefresh }: WorkflowCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    // 暂时默认进入工人采集页面
    navigate(`/workflow/${workflow.id}/worker`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    navigate(`/workflow/${workflow.id}/worker`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm(`确定要删除工作流 "${workflow.name}" 吗？此操作不可恢复！`)) return;

    try {
      await fetch(`${API_BASE}/api/workflows/${workflow.id}`, {
        method: 'DELETE',
      });
      onRefresh?.();
      window.location.reload(); // 简单刷新页面
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      alert('删除失败');
    }
  };

  const handleViewFlowchart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    navigate(`/workflow/${workflow.id}/flowchart`);
  };

  const handleViewDocument = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    navigate(`/workflow/${workflow.id}/review`);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer shadow-depth-1 hover-lift relative"
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

        {/* 三点菜单按钮 */}
        <button
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm"
          onClick={handleMenuClick}
        >
          <MoreVertical className="h-4 w-4 text-slate-600" />
        </button>

        {/* 下拉菜单 */}
        {menuOpen && (
          <>
            {/* 点击外部关闭 */}
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
            />
            <div className="absolute top-10 right-2 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]">
              <button
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" /> 编辑
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                onClick={handleViewFlowchart}
              >
                <GitBranch className="h-4 w-4" /> 查看流程图
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                onClick={handleViewDocument}
              >
                <FileText className="h-4 w-4" /> 查看文档
              </button>
              <div className="border-t border-slate-200 my-1" />
              <button
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" /> 删除
              </button>
            </div>
          </>
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
