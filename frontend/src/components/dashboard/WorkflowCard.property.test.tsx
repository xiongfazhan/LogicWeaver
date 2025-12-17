/**
 * WorkflowCard 属性测试
 * **Feature: universal-sop-architect, Property 12: Workflow Card Display Completeness**
 * **验证需求: 1.4**
 * 
 * 验证：对于任意工作流显示为卡片时，卡片应显示封面图（如果存在）、标题、最后编辑日期和状态徽章
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { WorkflowCard } from './WorkflowCard';
import { WorkflowSummary } from '@/api/generated/models/WorkflowSummary';

// 每次测试后清理 DOM
afterEach(() => {
  cleanup();
});

// 配置 fast-check 减少运行次数以加快测试
const FC_CONFIG = { numRuns: 50 };

/**
 * fast-check arbitrary for WorkflowSummary
 * 生成随机的 WorkflowSummary 对象
 * 注意：name 使用字母数字字符串，避免 testing-library 文本规范化问题
 * 使用 WorkflowSummary.status 枚举类型确保类型兼容性
 */
const workflowSummaryArb: fc.Arbitrary<WorkflowSummary> = fc.record({
  id: fc.uuid(),
  // 使用字母数字字符串，避免空格和特殊字符导致的匹配问题
  name: fc.stringMatching(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,20}$/),
  description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  cover_image_url: fc.option(
    fc.constant('https://example.com/image.jpg'),
    { nil: null }
  ),
  status: fc.constantFrom(WorkflowSummary.status.DRAFT, WorkflowSummary.status.DEPLOYED),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    .map(d => d.toISOString()),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    .map(d => d.toISOString()),
});

/**
 * 渲染 WorkflowCard 的辅助函数
 * 返回 container 用于 within 查询，避免全局 DOM 污染问题
 */
function renderWorkflowCard(workflow: WorkflowSummary) {
  // 先清理之前的渲染
  cleanup();
  
  const result = render(
    <BrowserRouter>
      <WorkflowCard workflow={workflow} />
    </BrowserRouter>
  );
  
  return result;
}

describe('WorkflowCard Property Tests', () => {
  /**
   * **Feature: universal-sop-architect, Property 12: Workflow Card Display Completeness**
   * **Validates: Requirements 1.4**
   */
  it('should display title for any workflow', () => {
    fc.assert(
      fc.property(workflowSummaryArb, (workflow) => {
        const { container } = renderWorkflowCard(workflow);
        
        // 验证标题显示 - 使用 textContent 检查避免规范化问题
        expect(container.textContent).toContain(workflow.name);
      }),
      FC_CONFIG
    );
  });

  it('should display cover image when present', () => {
    // 生成带有封面图的工作流
    const workflowWithCoverArb = workflowSummaryArb.map(w => ({
      ...w,
      cover_image_url: 'https://example.com/cover.jpg',
    }));

    fc.assert(
      fc.property(workflowWithCoverArb, (workflow) => {
        const { container } = renderWorkflowCard(workflow);
        
        // 验证封面图显示 - 通过 img 标签的 src 属性验证
        const imgElement = container.querySelector('img');
        expect(imgElement).not.toBeNull();
        expect(imgElement?.getAttribute('src')).toBe(workflow.cover_image_url);
        expect(imgElement?.getAttribute('alt')).toBe(workflow.name);
      }),
      FC_CONFIG
    );
  });

  it('should display placeholder when cover image is absent', () => {
    // 生成没有封面图的工作流
    const workflowWithoutCoverArb = workflowSummaryArb.map(w => ({
      ...w,
      cover_image_url: null,
    }));

    fc.assert(
      fc.property(workflowWithoutCoverArb, (workflow) => {
        const { container } = renderWorkflowCard(workflow);
        const card = within(container);
        
        // 验证占位符显示（📋 emoji）
        const placeholder = card.getByText('📋');
        expect(placeholder).toBeInTheDocument();
      }),
      FC_CONFIG
    );
  });

  it('should display formatted date for any workflow', () => {
    fc.assert(
      fc.property(workflowSummaryArb, (workflow) => {
        const { container } = renderWorkflowCard(workflow);
        
        // 验证日期显示 - 日期应该被格式化为中文格式
        const date = new Date(workflow.updated_at);
        const formattedDate = date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        
        // 检查容器中是否包含格式化的日期文本
        expect(container.textContent).toContain(formattedDate);
      }),
      FC_CONFIG
    );
  });

  it('should display status badge for any workflow', () => {
    fc.assert(
      fc.property(workflowSummaryArb, (workflow) => {
        const { container } = renderWorkflowCard(workflow);
        const card = within(container);
        
        // 验证状态徽章显示
        const expectedBadgeText = workflow.status === 'deployed' ? '已部署' : '草稿';
        const badgeElement = card.getByText(expectedBadgeText);
        expect(badgeElement).toBeInTheDocument();
      }),
      FC_CONFIG
    );
  });

  it('should display all required elements together for any workflow', () => {
    /**
     * 综合测试：验证所有必需元素同时显示
     * **Feature: universal-sop-architect, Property 12: Workflow Card Display Completeness**
     * **Validates: Requirements 1.4**
     */
    fc.assert(
      fc.property(workflowSummaryArb, (workflow) => {
        const { container } = renderWorkflowCard(workflow);
        const card = within(container);
        
        // 1. 验证标题 - 使用 textContent 检查
        expect(container.textContent).toContain(workflow.name);
        
        // 2. 验证封面图或占位符
        if (workflow.cover_image_url) {
          const imgElement = container.querySelector('img');
          expect(imgElement).not.toBeNull();
          expect(imgElement?.getAttribute('src')).toBe(workflow.cover_image_url);
        } else {
          expect(card.getByText('📋')).toBeInTheDocument();
        }
        
        // 3. 验证日期
        const date = new Date(workflow.updated_at);
        const formattedDate = date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        expect(container.textContent).toContain(formattedDate);
        
        // 4. 验证状态徽章
        const expectedBadgeText = workflow.status === 'deployed' ? '已部署' : '草稿';
        expect(card.getByText(expectedBadgeText)).toBeInTheDocument();
      }),
      FC_CONFIG
    );
  });
});
