/**
 * CreateWorkflowModal 组件
 * 创建工作流的模态框，包含名称、描述、封面图上传
 * 需求: 1.2, 1.3 - 创建工作流表单
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateWorkflow } from '@/hooks/useWorkflows';
import { useUploadFile } from '@/hooks/useFiles';
import { Upload, X, Loader2 } from 'lucide-react';

interface CreateWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkflowModal({ open, onOpenChange }: CreateWorkflowModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const createWorkflow = useCreateWorkflow();
  const uploadFile = useUploadFile();

  const isLoading = createWorkflow.isPending || uploadFile.isPending;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 显示预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传文件
    try {
      const response = await uploadFile.mutateAsync(file);
      setCoverImageUrl(response.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setCoverImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setCoverImageUrl(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      const workflow = await createWorkflow.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        cover_image_url: coverImageUrl || undefined,
      });

      // 重置表单
      setName('');
      setDescription('');
      setCoverImageUrl(null);
      setCoverImagePreview(null);

      // 关闭模态框并跳转到 Builder
      onOpenChange(false);
      navigate(`/workflow/${workflow.id}/worker`);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setDescription('');
      setCoverImageUrl(null);
      setCoverImagePreview(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建新工作流</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">名称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入工作流名称"
              disabled={isLoading}
              required
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入工作流描述（可选）"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* 封面图上传 */}
          <div className="space-y-2">
            <Label>封面图</Label>
            {coverImagePreview ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                {uploadFile.isPending ? (
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">点击上传封面图</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {createWorkflow.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '开始构建'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
