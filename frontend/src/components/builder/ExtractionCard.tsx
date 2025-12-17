/**
 * ExtractionCard 组件 (Micro-Step B)
 * 用于定义从上下文中提取的关键信息
 * 需求: 3.1, 3.2
 */
import { useState, useCallback, KeyboardEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import type { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';
import type { WorkflowStepUpdate } from '../../api/generated/models/WorkflowStepUpdate';

interface ExtractionCardProps {
  /** 当前步骤数据 */
  step: WorkflowStepResponse;
  /** 更新步骤数据回调 */
  onUpdate: (data: WorkflowStepUpdate) => void;
  /** 是否正在保存 */
  isSaving?: boolean;
}

export function ExtractionCard({ step, onUpdate, isSaving }: ExtractionCardProps) {
  const [keywords, setKeywords] = useState<string[]>(step.extraction_keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState(step.extraction_voice_transcript || '');
  const [inputMode, setInputMode] = useState<'keywords' | 'voice'>('keywords');

  /**
   * 添加关键词
   * 需求: 3.2 - WHEN a user enters keywords THEN the System SHALL store the keywords
   */
  const handleAddKeyword = useCallback(() => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      const newKeywords = [...keywords, trimmed];
      setKeywords(newKeywords);
      setKeywordInput('');
      onUpdate({ extraction_keywords: newKeywords });
    }
  }, [keywordInput, keywords, onUpdate]);

  /**
   * 处理键盘事件（Enter 添加关键词）
   */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  }, [handleAddKeyword]);

  /**
   * 移除关键词
   */
  const handleRemoveKeyword = useCallback((keyword: string) => {
    const newKeywords = keywords.filter((k) => k !== keyword);
    setKeywords(newKeywords);
    onUpdate({ extraction_keywords: newKeywords });
  }, [keywords, onUpdate]);

  /**
   * 处理语音转录变更
   */
  const handleVoiceChange = useCallback((value: string) => {
    setVoiceTranscript(value);
    onUpdate({ extraction_voice_transcript: value });
  }, [onUpdate]);

  /**
   * 从语音转录中提取关键词（简单实现）
   */
  const extractKeywordsFromVoice = useCallback(() => {
    if (!voiceTranscript.trim()) return;
    
    // 简单的关键词提取：按逗号、顿号、空格分割
    const extracted = voiceTranscript
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 50);
    
    const uniqueKeywords = [...new Set([...keywords, ...extracted])];
    setKeywords(uniqueKeywords);
    onUpdate({ extraction_keywords: uniqueKeywords });
  }, [voiceTranscript, keywords, onUpdate]);

  return (
    <div className="space-y-6">
      {/* 输入模式切换 */}
      <div className="space-y-3">
        <Label className="text-base font-medium">选择输入方式</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={inputMode === 'keywords' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('keywords')}
          >
            🏷️ 关键词输入
          </Button>
          <Button
            type="button"
            variant={inputMode === 'voice' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('voice')}
          >
            🎤 语音描述
          </Button>
        </div>
      </div>

      {/* 关键词输入模式 */}
      {inputMode === 'keywords' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🏷️ 提取关键词</CardTitle>
            <CardDescription>
              输入需要从上下文中提取的关键信息字段
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 关键词输入框 */}
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入关键词后按 Enter 添加..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim()}
              >
                添加
              </Button>
            </div>

            {/* 已添加的关键词列表 */}
            {keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="px-3 py-1 text-sm cursor-pointer hover:bg-slate-200"
                    onClick={() => handleRemoveKeyword(keyword)}
                  >
                    {keyword}
                    <span className="ml-2 text-slate-400 hover:text-slate-600">×</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                还没有添加关键词，请在上方输入
              </p>
            )}

            {/* 常用关键词建议 */}
            <div className="pt-2 border-t">
              <p className="text-xs text-slate-500 mb-2">常用关键词示例：</p>
              <div className="flex flex-wrap gap-1">
                {['金额', '日期', '客户名称', '订单号', '状态', '备注'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      if (!keywords.includes(suggestion)) {
                        const newKeywords = [...keywords, suggestion];
                        setKeywords(newKeywords);
                        onUpdate({ extraction_keywords: newKeywords });
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                    disabled={keywords.includes(suggestion)}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 语音描述模式 */}
      {inputMode === 'voice' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🎤 语音描述</CardTitle>
            <CardDescription>
              用自然语言描述需要提取的信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={voiceTranscript}
              onChange={(e) => handleVoiceChange(e.target.value)}
              placeholder="例如：我需要提取订单中的金额、日期和客户名称..."
              className="min-h-[120px]"
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={extractKeywordsFromVoice}
              disabled={!voiceTranscript.trim()}
            >
              从描述中提取关键词
            </Button>

            {/* 显示已提取的关键词 */}
            {keywords.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-500 mb-2">已提取的关键词：</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="px-3 py-1 text-sm cursor-pointer hover:bg-slate-200"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      {keyword}
                      <span className="ml-2 text-slate-400 hover:text-slate-600">×</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 提取结果预览 */}
      <Card className="bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-600">提取配置预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p className="text-slate-500">
              将从上下文中提取以下 <span className="font-medium text-indigo-600">{keywords.length}</span> 个字段：
            </p>
            {keywords.length > 0 ? (
              <p className="mt-1 text-slate-700">{keywords.join('、')}</p>
            ) : (
              <p className="mt-1 text-slate-400">暂无配置</p>
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

export default ExtractionCard;
