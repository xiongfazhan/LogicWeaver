/**
 * RoutingCard 组件 (Micro-Step D)
 * 用于配置步骤的路由逻辑：默认下一步和条件分支
 * 需求: 5.1, 5.2, 5.3, 5.4
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useAddRoutingBranch, useRemoveRoutingBranch } from '../../hooks/useSteps';
import type { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';
import type { WorkflowStepUpdate } from '../../api/generated/models/WorkflowStepUpdate';
import type { RoutingBranchResponse } from '../../api/generated/models/RoutingBranchResponse';

interface RoutingCardProps {
  /** 当前步骤数据 */
  step: WorkflowStepResponse;
  /** 工作流 ID */
  workflowId: string;
  /** 所有步骤列表（用于选择目标步骤） */
  allSteps: WorkflowStepResponse[];
  /** 更新步骤数据回调 */
  onUpdate: (data: WorkflowStepUpdate) => void;
  /** 是否正在保存 */
  isSaving?: boolean;
}

/**
 * 条件结果选项
 */
const CONDITION_RESULTS = [
  { value: 'FAIL', label: '不合格/异常', color: 'rose' },
  { value: 'NEEDS_REVIEW', label: '不确定/需复核', color: 'blue' },
  { value: 'UNSTABLE', label: '有隐患/不稳定', color: 'amber' },
];

/**
 * 动作类型选项
 */
const ACTION_TYPES = [
  { value: 'REJECT', label: '结束并记录' },
  { value: 'ESCALATE', label: '上报/转人工' },
  { value: 'RETRY', label: '复检一次' },
  { value: 'GOTO', label: '跳转到某个步骤' },
];

export function RoutingCard({ 
  step, 
  workflowId, 
  allSteps, 
  onUpdate, 
  isSaving 
}: RoutingCardProps) {
  const [defaultNext, setDefaultNext] = useState(step.routing_default_next || 'next');
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({
    condition_result: 'FAIL',
    action_type: 'REJECT',
    next_step_id: 'end_process',
  });

  const addBranch = useAddRoutingBranch();
  const removeBranch = useRemoveRoutingBranch();

  const branches = step.routing_branches || [];

  // 获取当前步骤之后的步骤列表
  const nextSteps = allSteps.filter((s) => s.step_order > step.step_order);

  /**
   * 处理默认下一步变更
   * 需求: 5.1 - WHEN a user enters the Routing micro-step THEN display default "Go to Next Step"
   */
  const handleDefaultNextChange = useCallback((value: string) => {
    setDefaultNext(value);
    onUpdate({ routing_default_next: value });
  }, [onUpdate]);

  /**
   * 添加条件分支
   * 需求: 5.2 - WHEN a user adds a condition branch THEN create a new branch card
   */
  const handleAddBranch = useCallback(async () => {
    try {
      await addBranch.mutateAsync({
        workflowId,
        stepId: step.id,
        data: newBranch,
      });
      setIsAddingBranch(false);
      setNewBranch({
        condition_result: 'FAIL',
        action_type: 'REJECT',
        next_step_id: 'end_process',
      });
    } catch (error) {
      console.error('添加分支失败:', error);
    }
  }, [addBranch, workflowId, step.id, newBranch]);

  /**
   * 删除条件分支
   * 需求: 5.4 - WHEN a user removes a branch THEN delete the branch configuration
   */
  const handleRemoveBranch = useCallback(async (branchId: string) => {
    try {
      await removeBranch.mutateAsync({
        workflowId,
        stepId: step.id,
        branchId,
      });
    } catch (error) {
      console.error('删除分支失败:', error);
    }
  }, [removeBranch, workflowId, step.id]);

  /**
   * 获取步骤名称
   */
  const getStepName = (stepId: string): string => {
    if (stepId === 'next') return '下一步';
    if (stepId === 'end_process') return '结束流程';
    const targetStep = allSteps.find((s) => s.id === stepId);
    return targetStep ? targetStep.name : stepId;
  };

  /**
   * 获取条件结果的颜色类
   */
  const getConditionColor = (condition: string): string => {
    const found = CONDITION_RESULTS.find((c) => c.value === condition);
    if (!found) return 'slate';
    return found.color;
  };

  const getConditionLabel = (condition: string): string => {
    const found = CONDITION_RESULTS.find((c) => c.value === condition);
    return found ? found.label : condition;
  };

  const getConditionTextClass = (condition: string): string => {
    const color = getConditionColor(condition);
    if (color === 'rose') return 'text-rose-600';
    if (color === 'amber') return 'text-amber-600';
    if (color === 'blue') return 'text-blue-600';
    return 'text-slate-600';
  };

  const getActionLabel = (action: string): string => {
    const found = ACTION_TYPES.find((a) => a.value === action);
    return found ? found.label : action;
  };

  /**
   * 渲染分支卡片
   * 需求: 5.5 - WHEN displaying branch cards THEN show failure branches with red left border
   */
  const renderBranchCard = (branch: RoutingBranchResponse) => {
    const color = getConditionColor(branch.condition_result);
    const borderColorClass = color === 'rose' ? 'border-l-rose-500' : 
                             color === 'amber' ? 'border-l-amber-500' : 
                             'border-l-blue-500';
    const conditionTextClass = getConditionTextClass(branch.condition_result);
    
    return (
      <Card 
        key={branch.id} 
        className={`border-l-4 ${borderColorClass}`}
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className={`${conditionTextClass} font-medium`}>
                  🔴 如果结果是 [{getConditionLabel(branch.condition_result)}]
                </span>
              </div>
              <div className="text-sm text-slate-600">
                → 要做: <span className="font-medium">{getActionLabel(branch.action_type)}</span>
              </div>
              <div className="text-sm text-slate-600">
                → 跳转到: <span className="font-medium">{getStepName(branch.next_step_id)}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveBranch(branch.id)}
              className="text-slate-400 hover:text-rose-500"
              disabled={removeBranch.isPending}
            >
              ×
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        这一步就像你交代徒弟：<span className="font-medium text-emerald-700">合格</span>怎么走（默认），
        <span className="font-medium text-rose-700">不合格/特殊情况</span>怎么处理（可选分支）。
      </div>

      {/* 默认路由 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            ✅ 合格后怎么走（默认）
          </CardTitle>
          <CardDescription>
            当检查结果正常/合格时，系统按这里继续。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>合格后去哪里</Label>
            <select
              value={defaultNext}
              onChange={(e) => handleDefaultNextChange(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="next">继续到下一步骤（推荐）</option>
              <option value="end_process">结束流程（本步骤就是最后一步）</option>
              {nextSteps.map((s) => (
                <option key={s.id} value={s.id}>
                  跳转到: {s.name || `步骤 ${s.step_order + 1}`}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 条件分支列表 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">不合格/特殊情况怎么处理（可选）</Label>
          <span className="text-xs text-slate-500">
            {branches.length} 个分支
          </span>
        </div>

        {branches.length > 0 ? (
          <div className="space-y-3">
            {branches.map(renderBranchCard)}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-slate-400">
              <p>暂时不配置也没关系</p>
              <p className="text-xs mt-1">常见做法：不合格直接结束流程，或转人工复核。</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 添加分支表单 */}
      {isAddingBranch ? (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">配置“特殊情况”的处理方式</CardTitle>
            <CardDescription>
              只要按下拉选就行：出现什么情况 → 做什么处理 → 去哪里。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 条件结果 */}
            <div className="space-y-2">
              <Label>当结果是</Label>
              <select
                value={newBranch.condition_result}
                onChange={(e) => setNewBranch({ ...newBranch, condition_result: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {CONDITION_RESULTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* 动作类型 */}
            <div className="space-y-2">
              <Label>要做什么处理</Label>
              <select
                value={newBranch.action_type}
                onChange={(e) => setNewBranch({ ...newBranch, action_type: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* 目标步骤 */}
            <div className="space-y-2">
              <Label>接下来去哪里</Label>
              <select
                value={newBranch.next_step_id}
                onChange={(e) => setNewBranch({ ...newBranch, next_step_id: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="end_process">结束流程</option>
                {allSteps.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || `步骤 ${s.step_order + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={handleAddBranch}
                disabled={addBranch.isPending}
              >
                {addBranch.isPending ? '添加中...' : '确认添加'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddingBranch(false)}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  await addBranch.mutateAsync({
                    workflowId,
                    stepId: step.id,
                    data: {
                      condition_result: 'FAIL',
                      action_type: 'REJECT',
                      next_step_id: 'end_process',
                    },
                  });
                } catch (error) {
                  console.error('添加分支失败:', error);
                }
              }}
              disabled={addBranch.isPending}
            >
              快速添加：不合格 → 结束
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setNewBranch({
                  condition_result: 'NEEDS_REVIEW',
                  action_type: 'ESCALATE',
                  next_step_id: 'end_process',
                });
                setIsAddingBranch(true);
              }}
              disabled={addBranch.isPending}
            >
              配置：需复核 → 怎么走
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setIsAddingBranch(true)}
            disabled={addBranch.isPending}
          >
            + 自定义添加分支
          </Button>
        </div>
      )}

      {/* 路由配置预览 */}
      <Card className="bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-600">本步预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600">🟢 合格</span>
              <span className="text-slate-400">→</span>
              <span className="text-slate-700">{getStepName(defaultNext)}</span>
            </div>
            {branches.map((branch) => (
              <div key={branch.id} className="flex items-center gap-2">
                <span className={getConditionTextClass(branch.condition_result)}>
                  🔴 {getConditionLabel(branch.condition_result)}
                </span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-700">
                  {getActionLabel(branch.action_type)} → {getStepName(branch.next_step_id)}
                </span>
              </div>
            ))}
            {branches.length === 0 && (
              <div className="text-slate-400">
                暂无分支：默认按“合格后怎么走”继续。
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 保存状态指示 */}
      {isSaving && (
        <p className="text-sm text-slate-500 text-center">保存中...</p>
      )}
    </div>
  );
}

export default RoutingCard;
