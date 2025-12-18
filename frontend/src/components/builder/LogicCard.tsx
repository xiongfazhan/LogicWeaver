/**
 * LogicCard 组件 (Micro-Step C)
 * 用于定义判断逻辑：硬规则或 Few-Shot 模式
 * 需求: 4.1, 4.2, 4.3, 4.4, 4.5
 */
import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useUploadFile } from '../../hooks/useFiles';
import { useCreateExample, useDeleteExample, useExamples } from '../../hooks/useExamples';
import type { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';
import type { WorkflowStepUpdate } from '../../api/generated/models/WorkflowStepUpdate';
import type { ExampleResponse } from '../../api/generated/models/ExampleResponse';
import { ExampleCreate } from '../../api/generated/models/ExampleCreate';

type LogicStrategy = 'rule_based' | 'few_shot';

interface LogicCardProps {
  /** 当前步骤数据 */
  step: WorkflowStepResponse;
  /** 更新步骤数据回调 */
  onUpdate: (data: WorkflowStepUpdate) => void;
  /** 是否正在保存 */
  isSaving?: boolean;
}

export function LogicCard({ step, onUpdate, isSaving }: LogicCardProps) {
  const [strategy, setStrategy] = useState<LogicStrategy>(
    (step.logic_strategy as LogicStrategy) || 'few_shot'
  );
  const [ruleExpression, setRuleExpression] = useState(step.logic_rule_expression || '');
  const [evaluationPrompt, setEvaluationPrompt] = useState(step.logic_evaluation_prompt || '');

  const [isAddingPassText, setIsAddingPassText] = useState(false);
  const [isAddingFailText, setIsAddingFailText] = useState(false);
  const [passText, setPassText] = useState('');
  const [failText, setFailText] = useState('');
  
  const passFileInputRef = useRef<HTMLInputElement>(null);
  const failFileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadFile = useUploadFile();
  const createExample = useCreateExample();
  const deleteExample = useDeleteExample();
  
  // 获取当前步骤的样本
  const { data: passingExamples = [] } = useExamples(step.id, 'PASS');
  const { data: failingExamples = [] } = useExamples(step.id, 'FAIL');

  /**
   * 处理策略切换
   * 需求: 4.1 - WHEN a user enters the Logic micro-step THEN display toggle between modes
   */
  const handleStrategyChange = useCallback((newStrategy: LogicStrategy) => {
    setStrategy(newStrategy);
    onUpdate({ logic_strategy: newStrategy });
  }, [onUpdate]);

  /**
   * 处理规则表达式变更
   * 需求: 4.2 - WHEN a user selects Hard Rules mode THEN display text input
   */
  const handleRuleChange = useCallback((value: string) => {
    setRuleExpression(value);
    onUpdate({ logic_rule_expression: value });
  }, [onUpdate]);

  /**
   * 处理评估提示词变更
   */
  const handlePromptChange = useCallback((value: string) => {
    setEvaluationPrompt(value);
    onUpdate({ logic_evaluation_prompt: value });
  }, [onUpdate]);

  /**
   * 处理样本上传
   * 需求: 4.4 - WHEN a user uploads passing examples THEN store with "PASS" label
   * 需求: 4.5 - WHEN a user uploads failing examples THEN store with "FAIL" label
   */
  const handleExampleUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    label: 'PASS' | 'FAIL'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 上传文件
      const result = await uploadFile.mutateAsync(file);
      
      // 创建样本记录
      await createExample.mutateAsync({
        stepId: step.id,
        data: {
          content: result.url,
          content_type: 'image',
          label: label === 'PASS' ? ExampleCreate.label.PASS : ExampleCreate.label.FAIL,
          description: file.name,
        },
      });
    } catch (error) {
      console.error('样本上传失败:', error);
    }
    
    // 清空 input
    e.target.value = '';
  }, [uploadFile, createExample, step.id]);

  const handleAddTextExample = useCallback(async (label: 'PASS' | 'FAIL') => {
    const content = label === 'PASS' ? passText : failText;
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      await createExample.mutateAsync({
        stepId: step.id,
        data: {
          content: trimmed,
          content_type: 'text',
          label: label === 'PASS' ? ExampleCreate.label.PASS : ExampleCreate.label.FAIL,
          description: '文字例子',
        },
      });

      if (label === 'PASS') {
        setPassText('');
        setIsAddingPassText(false);
      } else {
        setFailText('');
        setIsAddingFailText(false);
      }
    } catch (error) {
      console.error('添加文字例子失败:', error);
    }
  }, [createExample, failText, passText, step.id]);

  /**
   * 删除样本
   */
  const handleDeleteExample = useCallback(async (exampleId: string) => {
    try {
      await deleteExample.mutateAsync(exampleId);
    } catch (error) {
      console.error('删除样本失败:', error);
    }
  }, [deleteExample]);

  /**
   * 渲染样本列表
   */
  const renderExampleList = (examples: ExampleResponse[], label: 'PASS' | 'FAIL') => {
    if (examples.length === 0) {
      return (
        <p className="text-sm text-slate-400 text-center py-4">
          暂无{label === 'PASS' ? '通过' : '失败'}样本
        </p>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2">
        {examples.map((example) => (
          <div
            key={example.id}
            className="relative group rounded-lg overflow-hidden border bg-slate-50"
          >
            {example.content_type === 'image' ? (
              <img
                src={example.content}
                alt={example.description || '样本'}
                className="w-full h-20 object-cover"
              />
            ) : (
              <div className="w-full h-20 p-2 text-xs text-slate-600 overflow-hidden">
                {example.content}
              </div>
            )}
            <button
              type="button"
              onClick={() => handleDeleteExample(example.id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 策略切换 */}
      <div className="space-y-3">
        <Label className="text-base font-medium">你是怎么判断的？</Label>
        <p className="text-xs text-slate-500">
          标准说得清就“写标准”；说不清就“给例子”（推荐）。
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleStrategyChange('rule_based')}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              strategy === 'rule_based'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-2xl mb-2 block">📏</span>
            <span className="font-medium text-sm block">写标准（说得清）</span>
            <span className="text-xs text-slate-500">像写巡检标准一样写清楚合格条件</span>
          </button>
          <button
            type="button"
            onClick={() => handleStrategyChange('few_shot')}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              strategy === 'few_shot'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-2xl mb-2 block">🧠</span>
            <span className="font-medium text-sm block">给例子（说不清）</span>
            <span className="text-xs text-slate-500">拍几张合格/不合格，或写几句例子</span>
          </button>
        </div>
      </div>

      {/* 硬规则模式 */}
      {strategy === 'rule_based' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📏 合格标准（写清楚）</CardTitle>
            <CardDescription>
              把“合格的标准”写清楚，像交代徒弟检查要点一样。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={ruleExpression}
              onChange={(e) => handleRuleChange(e.target.value)}
              placeholder="例如：\n- 合格：无渗漏、无异响、温度 < 80℃、压力 0.4~0.6MPa\n- 不合格：任意一项不满足\n\n（如果你会写表达式也可以：温度 < 80 AND 无渗漏 AND 压力>=0.4 AND 压力<=0.6）"
              className="min-h-[100px] font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              不会写表达式也没关系，写成“巡检标准/口头标准”也可以；写不清建议选“给例子”。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Few-Shot 模式 */}
      {strategy === 'few_shot' && (
        <>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            完成本步需要：至少 <span className="font-medium text-emerald-700">1 个合格</span> +
            <span className="font-medium text-rose-700"> 1 个不合格</span> 的例子（图片或文字都行）。
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={passFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleExampleUpload(e, 'PASS')}
            className="hidden"
          />
          <input
            ref={failFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleExampleUpload(e, 'FAIL')}
            className="hidden"
          />

          {/* 样本上传区域 - 需求: 4.3, 4.6 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 通过样本 - 绿色样式 */}
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-emerald-700 flex items-center gap-2">
                  ✅ 合格/正常（例子）
                </CardTitle>
                <CardDescription className="text-emerald-600">
                  拍照或写一句话：什么样算合格
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderExampleList(passingExamples, 'PASS')}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => passFileInputRef.current?.click()}
                  disabled={uploadFile.isPending || createExample.isPending}
                >
                  {uploadFile.isPending ? '上传中...' : '+ 上传合格照片/截图'}
                </Button>

                {isAddingPassText ? (
                  <div className="space-y-2">
                    <Textarea
                      value={passText}
                      onChange={(e) => setPassText(e.target.value)}
                      placeholder="例如：压力 0.4~0.6MPa、无渗漏、无异响、温度正常。"
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddTextExample('PASS')}
                        disabled={!passText.trim() || createExample.isPending}
                      >
                        确认添加
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingPassText(false);
                          setPassText('');
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                    onClick={() => setIsAddingPassText(true)}
                    disabled={createExample.isPending}
                  >
                    + 添加合格文字
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 失败样本 - 红色样式 */}
            <Card className="border-rose-200 bg-rose-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-rose-700 flex items-center gap-2">
                  ❌ 不合格/异常（例子）
                </CardTitle>
                <CardDescription className="text-rose-600">
                  拍照或写一句话：什么样算不合格
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderExampleList(failingExamples, 'FAIL')}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-rose-300 text-rose-700 hover:bg-rose-100"
                  onClick={() => failFileInputRef.current?.click()}
                  disabled={uploadFile.isPending || createExample.isPending}
                >
                  {uploadFile.isPending ? '上传中...' : '+ 上传不合格照片/截图'}
                </Button>

                {isAddingFailText ? (
                  <div className="space-y-2">
                    <Textarea
                      value={failText}
                      onChange={(e) => setFailText(e.target.value)}
                      placeholder="例如：接口渗漏/有油迹、压力低于 0.4MPa、明显异响、温度过高。"
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddTextExample('FAIL')}
                        disabled={!failText.trim() || createExample.isPending}
                      >
                        确认添加
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingFailText(false);
                          setFailText('');
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-rose-300 text-rose-700 hover:bg-rose-100"
                    onClick={() => setIsAddingFailText(true)}
                    disabled={createExample.isPending}
                  >
                    + 添加不合格文字
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 评估提示词 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">💡 补充说明（可选）</CardTitle>
              <CardDescription>
                有特别注意点可以写一句话（例如“只看压力表，不用管外观”）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={evaluationPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="例如：优先判断是否渗漏；只要发现渗漏就判不合格。"
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* 配置预览 */}
      <Card className="bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-600">本步预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p className="text-slate-500">
              策略：<span className="font-medium text-indigo-600">
                {strategy === 'rule_based' ? '写标准' : '给例子'}
              </span>
            </p>
            {strategy === 'rule_based' ? (
              <p className="text-slate-500">
                标准：<span className="font-mono text-slate-700">{ruleExpression ? '已填写' : '未填写'}</span>
              </p>
            ) : (
              <p className="text-slate-500">
                样本数：<span className="text-emerald-600">{passingExamples.length} 通过</span>
                {' / '}
                <span className="text-rose-600">{failingExamples.length} 失败</span>
              </p>
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

export default LogicCard;
