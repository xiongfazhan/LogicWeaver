/**
 * Flowchart 工具函数
 * 需求: 9.4 - 将工作流步骤和路由转换为 ReactFlow 节点/边
 */
import type { WorkflowResponse, WorkflowStepResponse } from '../../types';
import type { FlowchartNode, FlowchartEdge, StepNodeData, BranchEdgeData } from './types';

/** 节点间垂直间距 */
const VERTICAL_SPACING = 180;

/** 节点间水平间距（用于分支） */
const HORIZONTAL_SPACING = 280;

/** 起始 X 坐标 */
const START_X = 400;

/** 起始 Y 坐标 */
const START_Y = 50;

/**
 * 将 WorkflowResponse 转换为 ReactFlow 节点和边
 * 需求: 9.4
 */
export function workflowToFlowchart(workflow: WorkflowResponse): {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
} {
  const nodes: FlowchartNode[] = [];
  const edges: FlowchartEdge[] = [];
  
  // 按 step_order 排序步骤
  const sortedSteps = [...(workflow.steps || [])].sort(
    (a, b) => a.step_order - b.step_order
  );

  if (sortedSteps.length === 0) {
    return { nodes, edges };
  }

  // 用于跟踪已创建的结束节点
  const endNodeIds = new Set<string>();
  
  // 创建步骤节点
  sortedSteps.forEach((step, index) => {
    const nodeData: StepNodeData = {
      title: step.name,
      thumbnailUrl: step.context_image_url,
      status: step.status || 'pending',
      order: step.step_order,
    };

    const node: FlowchartNode = {
      id: step.id,
      type: 'stepNode',
      position: { x: START_X, y: START_Y + index * VERTICAL_SPACING },
      data: nodeData,
    };

    nodes.push(node);

    // 创建边
    const nextStepIndex = index + 1;
    const hasNextStep = nextStepIndex < sortedSteps.length;
    
    // 默认路由边（成功路径）
    if (hasNextStep) {
      const defaultNext = step.routing_default_next;
      const targetId = defaultNext === 'next' || !defaultNext
        ? sortedSteps[nextStepIndex].id
        : defaultNext;

      // 只有当目标是有效步骤时才创建边
      if (sortedSteps.some(s => s.id === targetId) || targetId === sortedSteps[nextStepIndex].id) {
        const edge: FlowchartEdge = {
          id: `${step.id}-default`,
          source: step.id,
          target: targetId === 'next' ? sortedSteps[nextStepIndex].id : targetId,
          type: 'branchEdge',
          data: {
            edgeType: 'pass',
            label: 'Pass',
          } as BranchEdgeData,
        };
        edges.push(edge);
      }
    }

    // 处理分支路由
    if (step.routing_branches && step.routing_branches.length > 0) {
      step.routing_branches.forEach((branch, branchIndex) => {
        const isFailBranch = branch.condition_result.toLowerCase().includes('fail') ||
                            branch.action_type.toLowerCase().includes('reject') ||
                            branch.action_type.toLowerCase().includes('end');

        // 如果目标是 end_process，创建结束节点
        if (branch.next_step_id === 'end_process' || 
            branch.action_type.toLowerCase().includes('end')) {
          const endNodeId = `end-${step.id}-${branchIndex}`;
          
          if (!endNodeIds.has(endNodeId)) {
            endNodeIds.add(endNodeId);
            
            // 计算结束节点位置（在当前节点右侧）
            const endNode: FlowchartNode = {
              id: endNodeId,
              type: 'stepNode',
              position: {
                x: START_X + HORIZONTAL_SPACING,
                y: START_Y + index * VERTICAL_SPACING + 60,
              },
              data: {
                title: 'End Process',
                status: 'completed',
                order: -1,
                isEndNode: true,
              },
            };
            nodes.push(endNode);
          }

          // 创建到结束节点的边
          const edge: FlowchartEdge = {
            id: `${step.id}-branch-${branchIndex}`,
            source: step.id,
            target: endNodeId,
            type: 'branchEdge',
            data: {
              edgeType: 'fail',
              label: branch.condition_result || 'Fail',
            } as BranchEdgeData,
          };
          edges.push(edge);
        } else {
          // 创建到其他步骤的分支边
          const targetExists = sortedSteps.some(s => s.id === branch.next_step_id);
          
          if (targetExists) {
            const edge: FlowchartEdge = {
              id: `${step.id}-branch-${branchIndex}`,
              source: step.id,
              target: branch.next_step_id,
              type: 'branchEdge',
              data: {
                edgeType: isFailBranch ? 'fail' : 'pass',
                label: branch.condition_result || (isFailBranch ? 'Fail' : 'Pass'),
              } as BranchEdgeData,
            };
            edges.push(edge);
          }
        }
      });
    }
  });

  return { nodes, edges };
}

/**
 * 计算节点的自动布局位置
 * 使用简单的垂直布局算法
 */
export function calculateLayout(
  steps: WorkflowStepResponse[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order);
  
  sortedSteps.forEach((step, index) => {
    positions.set(step.id, {
      x: START_X,
      y: START_Y + index * VERTICAL_SPACING,
    });
  });

  return positions;
}
