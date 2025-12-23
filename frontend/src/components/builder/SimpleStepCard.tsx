import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useUploadFile } from '../../hooks/useFiles';
import type { WorkflowStepResponse } from '../../api/generated/models/WorkflowStepResponse';
import type { WorkflowStepUpdate } from '../../api/generated/models/WorkflowStepUpdate';

interface SimpleStepCardProps {
  step: WorkflowStepResponse;
  onUpdate: (data: WorkflowStepUpdate) => void;
  isSaving?: boolean;
}

export function SimpleStepCard({ step, onUpdate }: SimpleStepCardProps) {
  const [stepName, setStepName] = useState(step.name || '');
  const [instruction, setInstruction] = useState(
    step.context_description || step.logic_evaluation_prompt || ''
  );
  const [imageUrl, setImageUrl] = useState(step.context_image_url || '');
  const [textMaterial, setTextMaterial] = useState(step.context_text_content || '');
  const [voiceTranscript, setVoiceTranscript] = useState(step.context_voice_transcript || '');

  useEffect(() => {
    setStepName(step.name || '');
    setInstruction(step.context_description || step.logic_evaluation_prompt || '');
    setImageUrl(step.context_image_url || '');
    setTextMaterial(step.context_text_content || '');
    setVoiceTranscript(step.context_voice_transcript || '');
  }, [step.id]);

  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStepNameChange = useCallback(
    (value: string) => {
      setStepName(value);
      onUpdate({ name: value });
    },
    [onUpdate]
  );

  const handleInstructionChange = useCallback(
    (value: string) => {
      setInstruction(value);
      onUpdate({
        context_description: value,
        logic_strategy: 'few_shot',
        logic_evaluation_prompt: value,
      });
    },
    [onUpdate]
  );

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
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
    },
    [uploadFile, onUpdate]
  );

  const handleTextMaterialChange = useCallback(
    (value: string) => {
      setTextMaterial(value);
      onUpdate({ context_text_content: value, context_type: 'text' });
    },
    [onUpdate]
  );

  const handleVoiceTranscriptChange = useCallback(
    (value: string) => {
      setVoiceTranscript(value);
      onUpdate({ context_voice_transcript: value, context_type: 'voice' });
    },
    [onUpdate]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-medium">这一步要做什么？（必填）</Label>
        <Textarea
          value={instruction}
          onChange={(e) => handleInstructionChange(e.target.value)}
          placeholder={
            "建议按这个格式写：\n1）检查对象：……\n2）合格标准：……\n3）不合格怎么处理：……\n\n例如：\n检查 3# 泵房 2 号泵出口压力表。读数在 0.4~0.6MPa 且无漏油/无异响为通过；否则拍照记录并进入复核。"
          }
          className="min-h-[160px]"
        />
        <p className="text-xs text-slate-500">你只要把“意图/标准/异常处理”说清楚，后面结构化和推理交给 AI，最后你来复核。</p>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-medium">步骤名称（可选）</Label>
        <Input
          value={stepName}
          onChange={(e) => handleStepNameChange(e.target.value)}
          placeholder="例如：检查压力表读数"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">本步骤材料（可选）</Label>

        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📷 图片/截图</CardTitle>
            <CardDescription>拍清楚关键部位、读数、缺陷处。</CardDescription>
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
                    alt="步骤材料"
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
                className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📝 粘贴文字材料</CardTitle>
            <CardDescription>适合制度/标准/记录/工单描述等。</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={textMaterial}
              onChange={(e) => handleTextMaterialChange(e.target.value)}
              placeholder="例如：\n外观：无渗漏、无松动\n读数：压力 0.4~0.6MPa\n异常：有异响/有油迹则不通过"
              className="min-h-[120px]"
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTextMaterial('');
                  onUpdate({ context_text_content: null });
                }}
                disabled={!textMaterial.trim()}
              >
                清空
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🎤 语音材料（转写文本）</CardTitle>
            <CardDescription>不方便打字就把语音转写粘贴到这里。</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={voiceTranscript}
              onChange={(e) => handleVoiceTranscriptChange(e.target.value)}
              placeholder="例如：现场检查 2 号泵出口压力表，读数在 0.4~0.6 之间，未发现漏油和异响。"
              className="min-h-[120px]"
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
      </div>
    </div>
  );
}

export default SimpleStepCard;
