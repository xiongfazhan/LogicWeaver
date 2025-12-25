/**
 * FlowCanvas 组件 - ReactFlow 画布容器
 * 需求: 9.1 - 配置 ReactFlow 自定义节点和边类型
 * 支持任务分组显示
 */
import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StepNode } from './StepNode';
import { BranchEdge } from './BranchEdge';
import { tasksToFlowchart } from './utils';
import type { StepNodeData } from './types';

/** 自定义节点类型映射 */
const nodeTypes: NodeTypes = {
  stepNode: StepNode,
};

/** 自定义边类型映射 */
const edgeTypes: EdgeTypes = {
  branchEdge: BranchEdge,
};

/** 任务数据类型 */
interface TaskData {
  id: string;
  name: string;
  task_order: number;
  steps: StepData[];
}

/** 步骤数据类型 */
interface StepData {
  id: string;
  name: string;
  step_order: number;
  status: string;
  context_image_url?: string;
}

/** 数据契约类型 */
interface StepContract {
  step_id: number;
  step_name: string;
  business_intent: string;
  inputs: { name: string; type: string; description: string }[];
  outputs: { name: string; type: string; description: string }[];
}

/** AI 分析结果 */
interface AnalysisResponse {
  step_id: string;
  result: {
    contract: StepContract;
  };
}

interface FlowCanvasProps {
  /** 任务列表（含步骤） */
  tasks: TaskData[];
  /** AI 分析结果 */
  analysisResults?: AnalysisResponse[];
  /** 画布类名 */
  className?: string;
}

/**
 * FlowCanvas - ReactFlow 画布组件
 * 将任务和步骤渲染为可视化流程图
 */
export function FlowCanvas({ tasks, analysisResults, className }: FlowCanvasProps) {
  // 将任务和步骤转换为节点和边
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = tasksToFlowchart(tasks, analysisResults);
    return { initialNodes: nodes, initialEdges: edges };
  }, [tasks, analysisResults]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // 节点颜色映射（用于 MiniMap）
  const nodeColor = useCallback((node: Node) => {
    const data = node.data as StepNodeData;
    if (data?.isEndNode) return '#1e293b'; // slate-800
    if (data?.status === 'completed') return '#10b981'; // emerald-500
    return '#6366f1'; // indigo-500
  }, []);

  return (
    <div className={className}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1,
        }}
        defaultEdgeOptions={{
          type: 'branchEdge',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />
        <Controls
          showInteractive={false}
          className="!bg-white !border-slate-200 !shadow-lg"
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(241, 245, 249, 0.8)"
          className="!bg-white !border-slate-200 !shadow-lg"
        />
      </ReactFlow>
    </div>
  );
}
