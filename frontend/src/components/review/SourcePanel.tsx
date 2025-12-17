/**
 * SourcePanel 组件 - 显示源输入数据
 * 需求: 8.2 - WHEN displaying source inputs THEN the System SHALL show audio transcripts, images, and uploaded examples
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkflowStepResponse } from '@/api/generated/models/WorkflowStepResponse';
import { FileText, Image, Mic, CheckCircle, XCircle } from 'lucide-react';

interface SourcePanelProps {
  steps: WorkflowStepResponse[];
}

export function SourcePanel({ steps }: SourcePanelProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">暂无步骤数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">源输入</h2>
      
      {steps.map((step, index) => (
        <Card key={step.id} className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                步骤 {index + 1}: {step.name}
              </CardTitle>
              <Badge variant={step.status === 'completed' ? 'success' : 'secondary'}>
                {step.status === 'completed' ? '已完成' : '进行中'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Context 数据 */}
            {(step.context_type || step.context_description) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  {step.context_type === 'image' && <Image className="h-4 w-4" />}
                  {step.context_type === 'text' && <FileText className="h-4 w-4" />}
                  {step.context_type === 'voice' && <Mic className="h-4 w-4" />}
                  <span>上下文 (Context)</span>
                </div>
                
                {/* 图片预览 */}
                {step.context_image_url && (
                  <div className="mt-2">
                    <img 
                      src={step.context_image_url} 
                      alt="Context" 
                      className="max-w-full h-auto rounded-lg border border-slate-200"
                    />
                  </div>
                )}
                
                {/* 文本内容 */}
                {step.context_text_content && (
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                    {step.context_text_content}
                  </div>
                )}
                
                {/* 语音转录 */}
                {step.context_voice_transcript && (
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-slate-700">
                    <span className="text-blue-600 font-medium">💬 语音转录: </span>
                    {step.context_voice_transcript}
                  </div>
                )}
                
                {/* 描述 */}
                {step.context_description && (
                  <p className="text-sm text-slate-600">{step.context_description}</p>
                )}
              </div>
            )}
            
            {/* Extraction 数据 */}
            {(step.extraction_keywords?.length || step.extraction_voice_transcript) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4" />
                  <span>提取 (Extraction)</span>
                </div>
                
                {step.extraction_keywords && step.extraction_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {step.extraction_keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="bg-slate-50">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {step.extraction_voice_transcript && (
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-slate-700">
                    <span className="text-blue-600 font-medium">💬 语音转录: </span>
                    {step.extraction_voice_transcript}
                  </div>
                )}
              </div>
            )}
            
            {/* Few-Shot 样本 */}
            {step.examples && step.examples.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Image className="h-4 w-4" />
                  <span>样本 (Examples)</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* 通过样本 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      <span>通过样本</span>
                    </div>
                    <div className="space-y-2">
                      {step.examples
                        .filter(ex => ex.label === 'PASS')
                        .map(example => (
                          <div key={example.id} className="border border-emerald-200 bg-emerald-50/30 rounded-lg p-2">
                            {example.content_type === 'image' ? (
                              <img 
                                src={example.content} 
                                alt="Pass example" 
                                className="w-full h-auto rounded"
                              />
                            ) : (
                              <p className="text-sm text-slate-700">{example.content}</p>
                            )}
                            {example.description && (
                              <p className="text-xs text-slate-500 mt-1">{example.description}</p>
                            )}
                          </div>
                        ))}
                      {step.examples.filter(ex => ex.label === 'PASS').length === 0 && (
                        <p className="text-xs text-slate-400">暂无通过样本</p>
                      )}
                    </div>
                  </div>
                  
                  {/* 失败样本 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-rose-600 text-sm font-medium">
                      <XCircle className="h-4 w-4" />
                      <span>失败样本</span>
                    </div>
                    <div className="space-y-2">
                      {step.examples
                        .filter(ex => ex.label === 'FAIL')
                        .map(example => (
                          <div key={example.id} className="border border-rose-200 bg-rose-50/30 rounded-lg p-2">
                            {example.content_type === 'image' ? (
                              <img 
                                src={example.content} 
                                alt="Fail example" 
                                className="w-full h-auto rounded"
                              />
                            ) : (
                              <p className="text-sm text-slate-700">{example.content}</p>
                            )}
                            {example.description && (
                              <p className="text-xs text-slate-500 mt-1">{example.description}</p>
                            )}
                          </div>
                        ))}
                      {step.examples.filter(ex => ex.label === 'FAIL').length === 0 && (
                        <p className="text-xs text-slate-400">暂无失败样本</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
