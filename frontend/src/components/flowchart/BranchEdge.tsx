/**
 * BranchEdge 组件 - 流程图分支边
 * 需求: 9.3 - 成功路径为绿色，失败路径为红色
 */
import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Position,
} from '@xyflow/react';
import type { BranchEdgeData } from './types';

interface BranchEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: BranchEdgeData;
  markerEnd?: string;
}

/**
 * BranchEdge - 流程图中的分支边
 * 根据边类型显示不同颜色：
 * - pass: 绿色，显示 "Pass" 标签
 * - fail: 红色，显示 "Fail" 标签
 */
export const BranchEdge = memo(function BranchEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: BranchEdgeProps) {
  const edgeType = data?.edgeType ?? 'pass';
  const label = data?.label ?? (edgeType === 'pass' ? 'Pass' : 'Fail');

  // 根据边类型设置颜色
  const strokeColor = edgeType === 'pass' ? '#10b981' : '#ef4444'; // emerald-500 / red-500
  const labelBgColor = edgeType === 'pass' ? '#d1fae5' : '#fee2e2'; // emerald-100 / red-100
  const labelTextColor = edgeType === 'pass' ? '#059669' : '#dc2626'; // emerald-600 / red-600

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium shadow-sm"
            style={{
              backgroundColor: labelBgColor,
              color: labelTextColor,
            }}
          >
            {label}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
