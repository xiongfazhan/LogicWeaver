/**
 * File 上传相关的 React Query Hooks
 * 需求: 2.2 - 图片上传
 */
import { useMutation } from '@tanstack/react-query';
import { 
  FilesService,
  type FileUploadResponse,
  type FileDeleteResponse,
  ApiError,
} from '../api';

/**
 * 上传文件
 * 需求: 2.2 - WHEN a user uploads an image THEN the System SHALL store the image
 */
export function useUploadFile() {
  return useMutation<FileUploadResponse, ApiError, File>({
    mutationFn: async (file) => {
      // 创建 FormData 对象
      const formData = { file };
      return await FilesService.uploadFileApiFilesUploadPost(formData);
    },
  });
}

/**
 * 删除文件
 */
export function useDeleteFile() {
  return useMutation<FileDeleteResponse, ApiError, string>({
    mutationFn: async (fileUrl) => {
      return await FilesService.deleteFileApiFilesDeleteDelete({ url: fileUrl });
    },
  });
}
