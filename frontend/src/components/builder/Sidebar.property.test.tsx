/**
 * Sidebar 步骤导航属性测试
 * **Feature: universal-sop-architect, Property 11: Step Navigation Consistency**
 * **验证需求: 6.2**
 * 
 * 验证：对于任意步骤点击侧边栏后，Builder Workspace 应正确导航到该步骤
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fc from 'fast-check';
import { Sidebar } from './Sidebar';
import { useBuilderStore } from '../../stores/builderStore';
import { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';

// 每次测试后清理 DOM 和 store
afterEach(() => {
  cleanup();
  useBuilderStore.getState().reset();
});

beforeEach(() => {
  useBuilderStore.getState().reset();
});

// 配置 fast-check 减少运行次数以加快测试
const FC_CONFIG = { numRuns: 100 };

/**
 * fast-check arbitrary for WorkflowStepResponse
 * 生成随机的 WorkflowStepResponse 对象
 */
const workflowStepArb: fc.Arbitrary<WorkflowStepResponse> = fc.record({
  id: fc.uuid(),
  workflow_id: fc.uuid(),
  name: fc.stringMatching(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,20}$/),
  step_order: fc.integer({ min: 1, max: 100 }),
  status: fc.constantFrom(
    WorkflowStepResponse.status.PENDING,
    WorkflowStepResponse.status.COMPLETED
  ),
  context_type: fc.option(fc.constantFrom('image' as const, 'text' as const, 'voice' as const), { nil: null }),
  context_image_url: fc.option(fc.constant('https://example.com/image.jpg'), { nil: null }),
  context_text_content: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  context_voice_transcript: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  context_description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  extraction_keywords: fc.option(fc.array(fc.string({ maxLength: 20 }), { maxLength: 5 }), { nil: null }),
  extraction_voice_transcript: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  logic_strategy: fc.option(fc.constantFrom('rule_based' as const, 'few_shot' as const), { nil: null }),
  logic_rule_expression: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  logic_evaluation_prompt: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  routing_default_next: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    .map(d => d.toISOString()),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    .map(d => d.toISOString()),
  examples: fc.constant([]),
  routing_branches: fc.constant([]),
});

/**
 * 生成包含多个步骤的数组
 * 确保至少有 2 个步骤以便测试导航
 */
const stepsArrayArb = fc.array(workflowStepArb, { minLength: 2, maxLength: 10 })
  .map(steps => steps.map((step, index) => ({
    ...step,
    step_order: index + 1,
    name: step.name || `步骤 ${index + 1}`,
  })));

/**
 * 渲染 Sidebar 的辅助函数
 */
function renderSidebar(steps: WorkflowStepResponse[]) {
  cleanup();
  
  const mockOnAddStep = () => {};
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Sidebar
          workflowId={steps[0]?.workflow_id || 'test-workflow-id'}
          workflowName="测试工作流"
          steps={steps}
          isLoading={false}
          onAddStep={mockOnAddStep}
          isAddingStep={false}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Sidebar Step Navigation Property Tests', () => {
  /**
   * **Feature: universal-sop-architect, Property 11: Step Navigation Consistency**
   * **Validates: Requirements 6.2**
   * 
   * 验证：点击侧边栏任意步骤后，currentStepIndex 应更新为被点击步骤的索引
   */
  it('should update currentStepIndex when clicking any step in sidebar', () => {
    fc.assert(
      fc.property(
        stepsArrayArb,
        fc.integer({ min: 0, max: 9 }),
        (steps, targetIndexRaw) => {
          // 确保目标索引在有效范围内
          const targetIndex = targetIndexRaw % steps.length;
          
          // 重置 store 状态
          useBuilderStore.getState().reset();
          
          // 渲染 Sidebar
          const { container } = renderSidebar(steps);
          
          // 获取所有步骤按钮
          const stepButtons = container.querySelectorAll('button[data-testid^="sidebar-step-"]');
          expect(stepButtons.length).toBe(steps.length);
          
          // 点击目标步骤
          fireEvent.click(stepButtons[targetIndex]);
          
          // 验证 store 中的 currentStepIndex 已更新
          const { currentStepIndex } = useBuilderStore.getState();
          expect(currentStepIndex).toBe(targetIndex);
        }
      ),
      FC_CONFIG
    );
  });

  /**
   * **Feature: universal-sop-architect, Property 11: Step Navigation Consistency**
   * **Validates: Requirements 6.2**
   * 
   * 验证：点击当前已激活的步骤不会改变状态（幂等性）
   */
  it('should maintain state when clicking the already active step (idempotence)', () => {
    fc.assert(
      fc.property(
        stepsArrayArb,
        fc.integer({ min: 0, max: 9 }),
        (steps, initialIndexRaw) => {
          // 确保初始索引在有效范围内
          const initialIndex = initialIndexRaw % steps.length;
          
          // 重置 store 并设置初始步骤
          useBuilderStore.getState().reset();
          useBuilderStore.getState().setCurrentStep(initialIndex);
          
          // 渲染 Sidebar
          const { container } = renderSidebar(steps);
          
          // 获取所有步骤按钮
          const stepButtons = container.querySelectorAll('button[data-testid^="sidebar-step-"]');
          
          // 点击当前已激活的步骤
          fireEvent.click(stepButtons[initialIndex]);
          
          // 验证状态保持不变
          const { currentStepIndex } = useBuilderStore.getState();
          expect(currentStepIndex).toBe(initialIndex);
        }
      ),
      FC_CONFIG
    );
  });

  /**
   * **Feature: universal-sop-architect, Property 11: Step Navigation Consistency**
   * **Validates: Requirements 6.2**
   * 
   * 验证：连续点击不同步骤，最终状态应反映最后点击的步骤
   */
  it('should reflect the last clicked step after multiple navigations', () => {
    fc.assert(
      fc.property(
        stepsArrayArb,
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 2, maxLength: 5 }),
        (steps, clickSequenceRaw) => {
          // 将点击序列映射到有效索引范围
          const clickSequence = clickSequenceRaw.map(i => i % steps.length);
          const lastClickedIndex = clickSequence[clickSequence.length - 1];
          
          // 重置 store
          useBuilderStore.getState().reset();
          
          // 渲染 Sidebar
          const { container } = renderSidebar(steps);
          
          // 获取所有步骤按钮
          const stepButtons = container.querySelectorAll('button[data-testid^="sidebar-step-"]');
          
          // 执行点击序列
          for (const index of clickSequence) {
            fireEvent.click(stepButtons[index]);
          }
          
          // 验证最终状态反映最后点击的步骤
          const { currentStepIndex } = useBuilderStore.getState();
          expect(currentStepIndex).toBe(lastClickedIndex);
        }
      ),
      FC_CONFIG
    );
  });

  /**
   * **Feature: universal-sop-architect, Property 11: Step Navigation Consistency**
   * **Validates: Requirements 6.2**
   * 
   * 验证：步骤导航后，被点击的步骤应显示为激活状态（视觉反馈）
   */
  it('should visually highlight the clicked step as active', () => {
    fc.assert(
      fc.property(
        stepsArrayArb,
        fc.integer({ min: 0, max: 9 }),
        (steps, targetIndexRaw) => {
          // 确保目标索引在有效范围内
          const targetIndex = targetIndexRaw % steps.length;
          
          // 重置 store
          useBuilderStore.getState().reset();
          
          // 渲染 Sidebar
          const { container } = renderSidebar(steps);
          
          // 获取所有步骤按钮
          const stepButtons = container.querySelectorAll('button[data-testid^="sidebar-step-"]');
          
          // 点击目标步骤
          fireEvent.click(stepButtons[targetIndex]);
          
          // 重新渲染以反映状态变化
          cleanup();
          const { container: newContainer } = renderSidebar(steps);
          const newStepButtons = newContainer.querySelectorAll('button[data-testid^="sidebar-step-"]');
          
          // 验证被点击的步骤具有激活样式 (bg-indigo-50)
          const activeButton = newStepButtons[targetIndex];
          expect(activeButton.className).toContain('bg-indigo-50');
          expect(activeButton.className).toContain('text-indigo-700');
        }
      ),
      FC_CONFIG
    );
  });
});
