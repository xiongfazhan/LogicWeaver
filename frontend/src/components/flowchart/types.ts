/**
 * Flowchart 类型定义
 * 需求: 9.1, 9.2, 9.3
 */
import type { Node, Edge } from '@xyflow/react';

/** 数据字段 */
export interface DataFieldInfo {
  name: string;
  type: string;
}

/** 步骤节点数据 */
export interface StepNodeData extends Record<string, unknown> {
  /** 步骤标题 */
  title: string;
  /** 缩略图 URL */
  thumbnailUrl?: string | null;
  /** 步骤状态 */
  status: 'pending' | 'completed';
  /** 步骤顺序 */
  order: number;
  /** 是否为结束节点 */
  isEndNode?: boolean;
  /** 业务意图 */
  businessIntent?: string;
  /** 输入字段 */
  inputs?: DataFieldInfo[];
  /** 输出字段 */
  outputs?: DataFieldInfo[];
}

/** 边数据 */
export interface BranchEdgeData extends Record<string, unknown> {
  /** 边类型: pass (成功) 或 fail (失败) */
  edgeType: 'pass' | 'fail';
  /** 边标签 */
  label?: string;
}

/** 任务分组节点数据 */
export interface TaskGroupData extends Record<string, unknown> {
  /** 任务名称 */
  taskName: string;
  /** 任务序号 */
  taskOrder: number;
  /** 步骤数量 */
  stepCount: number;
}

/** Flowchart 节点类型 */
export type FlowchartNode = Node<StepNodeData, 'stepNode'> | Node<TaskGroupData, 'group'>;

/** Flowchart 边类型 */
export type FlowchartEdge = Edge<BranchEdgeData>;

/** 节点类型映射 */
export const NODE_TYPES = {
  stepNode: 'stepNode',
} as const;

/** 边类型映射 */
export const EDGE_TYPES = {
  branchEdge: 'branchEdge',
} as const;
