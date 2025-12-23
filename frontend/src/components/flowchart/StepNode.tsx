/**
 * StepNode 组件 - 流程图步骤节点
 * 需求: 9.2 - 富卡片节点，包含标题、业务意图、输入输出、状态徽章
 */
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, Circle, XCircle, ArrowRight } from 'lucide-react';
import type { StepNodeData } from './types';

/** 节点宽度 */
const NODE_WIDTH = 280;

interface StepNodeProps {
  data: StepNodeData;
}

/**
 * StepNode - 流程图中的步骤节点
 * 显示步骤标题、业务意图、输入输出、状态徽章
 */
export const StepNode = memo(function StepNode({ data }: StepNodeProps) {
  const { title, thumbnailUrl, status, order, isEndNode, businessIntent, inputs, outputs } = data;

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
        <div className="h-20 bg-slate-100 overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-12 bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
          <span className="text-xl font-bold text-white">
            {order}
          </span>
        </div>
      )}

      {/* 内容区域 */}
      <div className="p-3 space-y-2">
        {/* 标题 */}
        <h3 className="font-semibold text-slate-900 text-sm truncate">
          {title}
        </h3>

        {/* 业务意图 */}
        {businessIntent && (
          <p className="text-xs text-slate-600 line-clamp-2">
            📋 {businessIntent}
          </p>
        )}

        {/* 输入输出 */}
        {(inputs?.length || outputs?.length) ? (
          <div className="flex items-center gap-1 text-xs">
            {/* 输入 */}
            <div className="flex-1">
              {inputs && inputs.length > 0 ? (
                <div className="bg-blue-50 rounded px-1.5 py-0.5 text-blue-700">
                  <span className="font-medium">In:</span>
                  {' '}
                  {inputs.map(f => f.name).join(', ')}
                </div>
              ) : (
                <div className="text-slate-400 text-center">-</div>
              )}
            </div>

            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />

            {/* 输出 */}
            <div className="flex-1">
              {outputs && outputs.length > 0 ? (
                <div className="bg-emerald-50 rounded px-1.5 py-0.5 text-emerald-700">
                  <span className="font-medium">Out:</span>
                  {' '}
                  {outputs.map(f => f.name).join(', ')}
                </div>
              ) : (
                <div className="text-slate-400 text-center">-</div>
              )}
            </div>
          </div>
        ) : null}

        {/* 状态徽章 */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
          {status === 'completed' ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">
                已完成
              </span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">
                待处理
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
