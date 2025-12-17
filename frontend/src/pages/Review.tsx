/**
 * Review 页面 - Split Screen Review
 * 需求: 8.1 - WHEN a user enters review mode THEN the System SHALL display a split-screen layout
 * 需求: 8.2 - 左侧显示源输入
 * 需求: 8.3 - 右侧显示 AI 协议
 * 需求: 8.4 - 生成流程图按钮
 */
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkflow } from '@/hooks/useWorkflows';
import { useProtocol } from '@/hooks/useProtocol';
import { SourcePanel } from '@/components/review/SourcePanel';
import { ProtocolPanel } from '@/components/review/ProtocolPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Review() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 获取工作流数据
  const { data: workflow, isLoading: workflowLoading, error: workflowError } = useWorkflow(id || null);
  
  // 获取协议数据
  const { data: protocol, isLoading: protocolLoading, error: protocolError } = useProtocol(id || null);

  // 处理生成流程图按钮点击
  const handleGenerateFlowchart = () => {
    if (id) {
      navigate(`/workflow/${id}/flowchart`);
    }
  };

  // 加载状态
  if (workflowLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-slate-500">加载工作流数据...</span>
      </div>
    );
  }

  // 错误状态
  if (workflowError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <p className="text-rose-500 mb-4">加载工作流失败</p>
        <Link to="/" className="text-indigo-600 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link 
            to={`/workflow/${id}/builder`}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回编辑</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="text-xl font-semibold text-slate-900">
            复核: {workflow?.name || '工作流'}
          </h1>
        </div>
      </header>
      
      {/* Split Screen Layout - 需求 8.1 */}
      <div className="grid grid-cols-2 min-h-[calc(100vh-65px-80px)]">
        {/* Left Panel - Source Inputs - 需求 8.2 */}
        <div className="bg-slate-100 p-6 border-r border-slate-200 overflow-y-auto">
          <SourcePanel steps={workflow?.steps || []} />
        </div>

        {/* Right Panel - AI Protocol - 需求 8.3 */}
        <div className="bg-white p-6 overflow-y-auto">
          <ProtocolPanel 
            protocol={protocol || null}
            isLoading={protocolLoading}
            error={protocolError?.message}
          />
        </div>
      </div>

      {/* Floating Footer - 需求 8.4 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-sm text-slate-500">
            {workflow?.steps?.length || 0} 个步骤 · 
            {workflow?.steps?.filter(s => s.status === 'completed').length || 0} 个已完成
          </div>
          <Button 
            onClick={handleGenerateFlowchart}
            className="px-6 bg-indigo-600 hover:bg-indigo-700"
          >
            生成流程图 →
          </Button>
        </div>
      </div>
    </div>
  );
}
