import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadFile } from '@/lib/api';
import type { UploadResponse } from '@/types';

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation<UploadResponse, Error, File>({
    mutationFn: uploadFile,
    onSuccess: () => {
      // 업로드 성공 시 업로드 목록을 다시 가져옴
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
    },
  });
}

