/**
 * StepNode 属性测试
 * **Feature: universal-sop-architect, Property 9: Flowchart Node Completeness**
 * **验证需求: 9.1, 9.2**
 * 
 * 验证：对于任意 WorkflowStep 渲染为流程图节点，节点应显示步骤标题、缩略图（如果存在）和状态徽章
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, within } from '@testing-library/react';
import * as fc from 'fast-check';
import { ReactFlowProvider } from '@xyflow/react';
import { StepNode } from './StepNode';
import type { StepNodeData } from './types';

// 每次测试后清理 DOM
afterEach(() => {
  cleanup();
});

// 配置 fast-check 减少运行次数以加快测试
const FC_CONFIG = { numRuns: 100 };

/**
 * fast-check arbitrary for StepNodeData
 * 生成随机的 StepNodeData 对象
 */
const stepNodeDataArb: fc.Arbitrary<StepNodeData> = fc.record({
  // 使用字母数字和中文字符串，避免空字符串
  title: fc.stringMatching(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,30}$/),
  // 缩略图 URL 可选
  thumbnailUrl: fc.option(
    fc.constant('https://example.com/thumbnail.jpg'),
    { nil: null }
  ),
  // 状态
  status: fc.constantFrom('pending' as const, 'completed' as const),
  // 步骤顺序
  order: fc.integer({ min: 1, max: 100 }),
  // 非结束节点
  isEndNode: fc.constant(false),
});

/**
 * 生成结束节点数据
 */
const endNodeDataArb: fc.Arbitrary<StepNodeData> = fc.record({
  title: fc.stringMatching(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,30}$/),
  thumbnailUrl: fc.constant(null),
  status: fc.constantFrom('pending' as const, 'completed' as const),
  order: fc.integer({ min: 1, max: 100 }),
  isEndNode: fc.constant(true),
});

/**
 * 渲染 StepNode 的辅助函数
 * 使用 ReactFlowProvider 包装以提供必要的 context
 */
function renderStepNode(data: StepNodeData) {
  cleanup();
  return render(
    <ReactFlowProvider>
      <StepNode data={data} />
    </ReactFlowProvider>
  );
}

describe('StepNode Property Tests', () => {
  /**
   * **Feature: universal-sop-architect, Property 9: Flowchart Node Completeness**
   * **Validates: Requirements 9.1, 9.2**
   */
  it('should display title for any step node', () => {
    fc.assert(
      fc.property(stepNodeDataArb, (data) => {
        const { container } = renderStepNode(data);
        
        // 验证标题显示
        expect(container.textContent).toContain(data.title);
      }),
      FC_CONFIG
    );
  });

  it('should display thumbnail image when present', () => {
    // 生成带有缩略图的节点数据
    const nodeWithThumbnailArb = stepNodeDataArb.map(d => ({
      ...d,
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
    }));

    fc.assert(
      fc.property(nodeWithThumbnailArb, (data) => {
        const { container } = renderStepNode(data);
        
        // 验证缩略图显示
        const imgElement = container.querySelector('img');
        expect(imgElement).not.toBeNull();
        expect(imgElement?.getAttribute('src')).toBe(data.thumbnailUrl);
        expect(imgElement?.getAttribute('alt')).toBe(data.title);
      }),
      FC_CONFIG
    );
  });

  it('should display order placeholder when thumbnail is absent', () => {
    // 生成没有缩略图的节点数据
    const nodeWithoutThumbnailArb = stepNodeDataArb.map(d => ({
      ...d,
      thumbnailUrl: null,
    }));

    fc.assert(
      fc.property(nodeWithoutThumbnailArb, (data) => {
        const { container } = renderStepNode(data);
        
        // 验证占位符显示步骤顺序号
        expect(container.textContent).toContain(String(data.order));
      }),
      FC_CONFIG
    );
  });

  it('should display completed status badge when status is completed', () => {
    // 生成已完成状态的节点数据
    const completedNodeArb = stepNodeDataArb.map(d => ({
      ...d,
      status: 'completed' as const,
    }));

    fc.assert(
      fc.property(completedNodeArb, (data) => {
        const { container } = renderStepNode(data);
        const node = within(container);
        
        // 验证已完成状态徽章显示
        expect(node.getByText('Completed')).toBeInTheDocument();
      }),
      FC_CONFIG
    );
  });

  it('should display pending status badge when status is pending', () => {
    // 生成待处理状态的节点数据
    const pendingNodeArb = stepNodeDataArb.map(d => ({
      ...d,
      status: 'pending' as const,
    }));

    fc.assert(
      fc.property(pendingNodeArb, (data) => {
        const { container } = renderStepNode(data);
        const node = within(container);
        
        // 验证待处理状态徽章显示
        expect(node.getByText('Pending')).toBeInTheDocument();
      }),
      FC_CONFIG
    );
  });

  it('should display all required elements together for any step node', () => {
    /**
     * 综合测试：验证所有必需元素同时显示
     * **Feature: universal-sop-architect, Property 9: Flowchart Node Completeness**
     * **Validates: Requirements 9.1, 9.2**
     */
    fc.assert(
      fc.property(stepNodeDataArb, (data) => {
        const { container } = renderStepNode(data);
        const node = within(container);
        
        // 1. 验证标题
        expect(container.textContent).toContain(data.title);
        
        // 2. 验证缩略图或占位符
        if (data.thumbnailUrl) {
          const imgElement = container.querySelector('img');
          expect(imgElement).not.toBeNull();
          expect(imgElement?.getAttribute('src')).toBe(data.thumbnailUrl);
        } else {
          // 占位符显示步骤顺序号
          expect(container.textContent).toContain(String(data.order));
        }
        
        // 3. 验证状态徽章
        const expectedStatusText = data.status === 'completed' ? 'Completed' : 'Pending';
        expect(node.getByText(expectedStatusText)).toBeInTheDocument();
      }),
      FC_CONFIG
    );
  });

  it('should render end node with title only', () => {
    /**
     * 结束节点测试：验证结束节点正确渲染标题
     */
    fc.assert(
      fc.property(endNodeDataArb, (data) => {
        const { container } = renderStepNode(data);
        
        // 验证标题显示
        expect(container.textContent).toContain(data.title);
        
        // 结束节点不应显示缩略图
        const imgElement = container.querySelector('img');
        expect(imgElement).toBeNull();
      }),
      FC_CONFIG
    );
  });
});
