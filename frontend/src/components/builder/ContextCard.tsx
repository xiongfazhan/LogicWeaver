/**
 * ContextCard 组件 (Micro-Step A)
 * 用于采集步骤的上下文信息：图片上传、文本输入、语音描述
 * 需求: 2.1, 2.2, 2.3
 */
import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useUploadFile } from '../../hooks/useFiles';
import type { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';
import type { WorkflowStepUpdate } from '../../api/generated/models/WorkflowStepUpdate';

type ContextType = 'image' | 'text' | 'voice';

interface ContextCardProps {
  /** 当前步骤数据 */
  step: WorkflowStepResponse;
  /** 更新步骤数据回调 */
  onUpdate: (data: WorkflowStepUpdate) => void;
  /** 是否正在保存 */
  isSaving?: boolean;
}

/**
 * 上下文类型选项配置
 */
const CONTEXT_TYPE_OPTIONS: { value: ContextType; label: string; icon: string; description: string }[] = [
  { value: 'image', label: '拍照/截图（推荐）', icon: '📷', description: '现场拍清楚关键部位即可' },
  { value: 'text', label: '粘贴文字', icon: '📝', description: '适合制度/标准/记录等文字材料' },
  { value: 'voice', label: '语音转文字', icon: '🎤', description: '不方便打字就说一句话' },
];

export function ContextCard({ step, onUpdate, isSaving }: ContextCardProps) {
  const [contextType, setContextType] = useState<ContextType>(
    (step.context_type as ContextType) || 'image'
  );
  const [imageUrl, setImageUrl] = useState(step.context_image_url || '');
  const [textContent, setTextContent] = useState(step.context_text_content || '');
  const [voiceTranscript, setVoiceTranscript] = useState(step.context_voice_transcript || '');
  const [description, setDescription] = useState(step.context_description || '');

  const previewTypeLabel = (() => {
    if (imageUrl) return '图片/截图';
    if (textContent.trim()) return '文字';
    if (voiceTranscript.trim()) return '语音描述';
    return '未提供';
  })();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFile = useUploadFile();

  /**
   * 处理上下文类型切换
   */
  const handleTypeChange = useCallback((type: ContextType) => {
    setContextType(type);
    onUpdate({ context_type: type });
  }, [onUpdate]);

  /**
   * 处理图片上传
   * 需求: 2.2 - WHEN a user uploads an image THEN the System SHALL store the image
   */
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile.mutateAsync(file);
      const url = result.url;
      setImageUrl(url);
      onUpdate({ context_image_url: url, context_type: 'image' });
    } catch (error) {
      console.error('图片上传失败:', error);
    }
  }, [uploadFile, onUpdate]);

  /**
   * 处理文本内容变更
   * 需求: 2.3 - WHEN a user provides text selection THEN the System SHALL capture the text
   */
  const handleTextChange = useCallback((value: string) => {
    setTextContent(value);
    onUpdate({ context_text_content: value, context_type: 'text' });
  }, [onUpdate]);

  /**
   * 处理语音转录变更
   */
  const handleVoiceChange = useCallback((value: string) => {
    setVoiceTranscript(value);
    onUpdate({ context_voice_transcript: value, context_type: 'voice' });
  }, [onUpdate]);

  /**
   * 处理描述变更
   */
  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    onUpdate({ context_description: value });
  }, [onUpdate]);

  /**
   * 触发文件选择
   */
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-6">
      {/* 上下文类型选择 */}
      <div className="space-y-3">
        <Label className="text-base font-medium">选一种最方便的方式（任选一种即可）</Label>
        <div className="grid grid-cols-3 gap-3">
          {CONTEXT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTypeChange(option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                contextType === option.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">{option.icon}</span>
              <span className="font-medium text-sm block">{option.label}</span>
              <span className="text-xs text-slate-500">{option.description}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          只要给出其中一种，AI 就能“看见”你要检查的对象。
        </p>
      </div>

      {/* 根据类型显示不同的输入区域 */}
      {contextType === 'image' && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📷 拍照/截图（推荐）</CardTitle>
            <CardDescription>
              把要检查的画面拍清楚（关键部位、读数、缺陷处）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {imageUrl ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border bg-slate-50">
                  <img
                    src={imageUrl}
                    alt="上下文图片"
                    className="w-full h-48 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerFileSelect}
                    disabled={uploadFile.isPending}
                  >
                    更换图片
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImageUrl('');
                      onUpdate({ context_image_url: null });
                    }}
                  >
                    移除
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={triggerFileSelect}
                className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
              >
                {uploadFile.isPending ? (
                  <p className="text-slate-500">上传中...</p>
                ) : (
                  <>
                    <p className="text-slate-600 mb-2">点击上传照片/截图</p>
                    <p className="text-xs text-slate-400">尽量拍清楚，重点区域占画面 1/2 以上</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {contextType === 'text' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📝 粘贴文字</CardTitle>
            <CardDescription>
              把巡检标准/记录/工单描述里要检查的那段文字粘贴到这里。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="例如：\n- 外观：无渗漏、无松动\n- 读数：压力 0.4~0.6MPa\n- 异常：有异响/有油迹则不通过"
              className="min-h-[150px]"
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTextContent('');
                  onUpdate({ context_text_content: null });
                }}
                disabled={!textContent.trim()}
              >
                清空
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {contextType === 'voice' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🎤 语音转文字</CardTitle>
            <CardDescription>
              用一句话说明你要检查的对象和位置（越具体越好）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={voiceTranscript}
              onChange={(e) => handleVoiceChange(e.target.value)}
              placeholder="例如：检查 3# 泵房 2 号泵的出口压力表读数，重点看有没有漏油和异常震动。"
              className="min-h-[150px]"
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVoiceTranscript('');
                  onUpdate({ context_voice_transcript: null });
                }}
                disabled={!voiceTranscript.trim()}
              >
                清空
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 上下文描述（通用） */}
      <div className="space-y-2">
        <Label htmlFor="context-description">补充说明（可选）</Label>
        <Input
          id="context-description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="例如：重点看阀门连接处是否渗漏；或只看仪表盘左上角读数"
        />
        <p className="text-xs text-slate-500">
          写一句“重点看哪里/看什么”就行，不用很专业。
        </p>
      </div>

      <Card className="bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-600">本步预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="text-slate-500">
              已提供：<span className="font-medium text-indigo-600">{previewTypeLabel}</span>
            </div>
            {textContent.trim() && !imageUrl && (
              <div className="text-slate-700 whitespace-pre-wrap">
                {textContent.trim().slice(0, 160)}
                {textContent.trim().length > 160 ? '…' : ''}
              </div>
            )}
            {voiceTranscript.trim() && !imageUrl && !textContent.trim() && (
              <div className="text-slate-700 whitespace-pre-wrap">
                {voiceTranscript.trim().slice(0, 160)}
                {voiceTranscript.trim().length > 160 ? '…' : ''}
              </div>
            )}
            {description.trim() && (
              <div className="text-slate-500">
                说明：<span className="text-slate-700">{description.trim()}</span>
              </div>
            )}
            {!imageUrl && !textContent.trim() && !voiceTranscript.trim() && (
              <div className="text-slate-400">暂未填写。先随便选一种方式把材料交给 AI。</div>
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

export default ContextCard;
