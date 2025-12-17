/**
 * ProtocolPanel 组件 - 显示 AI 协议数据
 * 需求: 8.3 - WHEN displaying AI protocol THEN the System SHALL render the JSON logic as readable UI cards with badges
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProtocolWorkflow } from '@/api/generated/models/ProtocolWorkflow';
import type { ProtocolStep } from '@/api/generated/models/ProtocolStep';
import { ProtocolLogicConfig } from '@/api/generated/models/ProtocolLogicConfig';
import { ProtocolFewShotExample } from '@/api/generated/models/ProtocolFewShotExample';
import { 
  Cpu, 
  GitBranch, 
  FileOutput, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface ProtocolPanelProps {
  protocol: ProtocolWorkflow | null;
  isLoading?: boolean;
  error?: string | null;
}

export function ProtocolPanel({ protocol, isLoading, error }: ProtocolPanelProps) {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-slate-500">加载协议数据...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-rose-500">{error}</p>
      </div>
    );
  }

  if (!protocol || !protocol.steps || protocol.steps.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">暂无协议数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">AI 协议</h2>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
          {protocol.steps.length} 个步骤
        </Badge>
      </div>
      
      {protocol.steps.map((step, index) => (
        <StepProtocolCard key={step.step_id} step={step} index={index} />
      ))}
    </div>
  );
}

interface StepProtocolCardProps {
  step: ProtocolStep;
  index: number;
}

function StepProtocolCard({ step, index }: StepProtocolCardProps) {
  const isRuleBased = step.logic_config.logic_strategy === ProtocolLogicConfig.logic_strategy.RULE_BASED;
  
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            步骤 {index + 1}: {step.step_name}
          </CardTitle>
          <Badge 
            variant={isRuleBased ? 'outline' : 'default'}
            className={isRuleBased 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-indigo-100 text-indigo-700 border-indigo-200'
            }
          >
            {isRuleBased ? '📏 硬规则' : '🧠 语义相似'}
          </Badge>
        </div>
        {step.business_domain && (
          <p className="text-sm text-slate-500">{step.business_domain}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Spec */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FileOutput className="h-4 w-4" />
            <span>输入规格</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">数据源:</span>
              <Badge variant="outline" className="text-xs">{step.input_spec.data_source || '-'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">目标区域:</span>
              <Badge variant="outline" className="text-xs">{step.input_spec.target_section || '-'}</Badge>
            </div>
            {step.input_spec.context_description && (
              <p className="text-sm text-slate-600 mt-2">{step.input_spec.context_description}</p>
            )}
          </div>
        </div>
        
        {/* Logic Config */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Cpu className="h-4 w-4" />
            <span>逻辑配置</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg space-y-2">
            {isRuleBased && step.logic_config.rule_expression && (
              <div className="bg-amber-50 border border-amber-200 p-2 rounded text-sm font-mono">
                {step.logic_config.rule_expression}
              </div>
            )}
            
            {!isRuleBased && step.logic_config.few_shot_examples && step.logic_config.few_shot_examples.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Few-Shot 样本:</p>
                <div className="grid grid-cols-2 gap-2">
                  {step.logic_config.few_shot_examples.map((example, idx) => (
                    <FewShotExampleBadge key={idx} example={example} />
                  ))}
                </div>
              </div>
            )}
            
            {step.logic_config.evaluation_prompt && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">评估提示:</p>
                <p className="text-sm text-slate-600 italic">"{step.logic_config.evaluation_prompt}"</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Routing Map */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <GitBranch className="h-4 w-4" />
            <span>路由配置</span>
          </div>
          <div className="space-y-2">
            {/* Default Route */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">默认:</span>
              <ArrowRight className="h-4 w-4 text-emerald-600" />
              <Badge variant="success">{step.routing_map.default_next || '下一步'}</Badge>
            </div>
            
            {/* Branches */}
            {step.routing_map.branches && step.routing_map.branches.length > 0 && (
              <div className="space-y-2">
                {step.routing_map.branches.map((branch, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-2 rounded-lg border-l-4 border-l-rose-500"
                  >
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span className="text-sm text-rose-700">
                      如果 {branch.condition_result}:
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {branch.action_type}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-rose-600" />
                    <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-300">
                      {branch.next_step_id}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Output Schema */}
        {step.output_schema.fields && step.output_schema.fields.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <FileOutput className="h-4 w-4" />
              <span>输出字段</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {step.output_schema.fields.map((field, idx) => (
                <Badge key={idx} variant="outline" className="bg-slate-50">
                  {field.name}: <span className="text-slate-500">{field.type}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FewShotExampleBadgeProps {
  example: {
    content: string;
    label: ProtocolFewShotExample.label;
    description: string;
  };
}

function FewShotExampleBadge({ example }: FewShotExampleBadgeProps) {
  const isPass = example.label === ProtocolFewShotExample.label.PASS;
  
  return (
    <div 
      className={`p-2 rounded border text-xs ${
        isPass 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-rose-50 border-rose-200'
      }`}
    >
      <div className="flex items-center gap-1 mb-1">
        {isPass ? (
          <CheckCircle className="h-3 w-3 text-emerald-600" />
        ) : (
          <XCircle className="h-3 w-3 text-rose-600" />
        )}
        <span className={isPass ? 'text-emerald-700' : 'text-rose-700'}>
          {isPass ? 'PASS' : 'FAIL'}
        </span>
      </div>
      <p className="text-slate-600 truncate" title={example.description}>
        {example.description || example.content}
      </p>
    </div>
  );
}
