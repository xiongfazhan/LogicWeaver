/**
 * StepNode 组件 - 流程图步骤节点
 * 需求: 9.2 - 富卡片节点，包含标题、缩略图、状态徽章
 */
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, Circle, XCircle } from 'lucide-react';
import type { StepNodeData } from './types';

/** 节点宽度 */
const NODE_WIDTH = 200;

interface StepNodeProps {
  data: StepNodeData;
}

/**
 * StepNode - 流程图中的步骤节点
 * 显示步骤标题、缩略图（如果有）和状态徽章
 */
export const StepNode = memo(function StepNode({ data }: StepNodeProps) {
  const { title, thumbnailUrl, status, order, isEndNode } = data;

  // 结束节点特殊渲染
  if (isEndNode) {
    return (
      <div 
        className="bg-slate-800 text-white rounded-lg shadow-lg border-2 border-slate-700 px-4 py-3 min-w-[160px]"
        style={{ width: NODE_WIDTH }}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-slate-500 !w-3 !h-3"
        />
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-sm">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border-2 border-slate-200 overflow-hidden"
      style={{ width: NODE_WIDTH }}
    >
      {/* 顶部连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-indigo-500 !w-3 !h-3"
      />

      {/* 缩略图区域 */}
      {thumbnailUrl ? (
        <div className="h-24 bg-slate-100 overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <span className="text-3xl font-bold text-slate-300">
            {order}
          </span>
        </div>
      )}

      {/* 内容区域 */}
      <div className="p-3">
        {/* 标题 */}
        <h3 className="font-semibold text-slate-900 text-sm truncate mb-2">
          {title}
        </h3>

        {/* 状态徽章 */}
        <div className="flex items-center gap-1.5">
          {status === 'completed' ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">
                Completed
              </span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">
                Pending
              </span>
            </>
          )}
        </div>
      </div>

      {/* 底部连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-500 !w-3 !h-3"
      />
    </div>
  );
});
