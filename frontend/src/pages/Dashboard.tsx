/**
 * Dashboard 页面
 * 显示所有工作流卡片和创建新工作流入口
 * 需求: 1.1 - WHEN a user visits the dashboard THEN the System SHALL display all existing workflows as a grid of cards
 */
import { useState } from 'react';
import { useWorkflows } from '@/hooks/useWorkflows';
import { WorkflowCard, CreateWorkflowCard, TemplateSelectModal } from '@/components/dashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const { data, isLoading, error } = useWorkflows();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - 包含标题和用户头像 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900">📋 我的工作流</h1>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
            U
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
            加载工作流失败，请稍后重试
          </div>
        )}

        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          /* 工作流卡片 Grid 布局 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 创建新工作流卡片 */}
            <CreateWorkflowCard onClick={() => setIsTemplateModalOpen(true)} />

            {/* 工作流卡片列表 */}
            {data?.items.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        )}

        {/* 空状态提示 */}
        {!isLoading && !error && data?.items.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-500">还没有工作流，点击上方卡片创建第一个吧！</p>
          </div>
        )}
      </main>

      {/* 模板选择模态框 */}
      <TemplateSelectModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
      />
    </div>
  );
}

