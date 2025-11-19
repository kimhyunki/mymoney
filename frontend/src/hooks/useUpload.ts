import { useQuery } from '@tanstack/react-query';
import { getUpload } from '@/lib/api';
import type { UploadHistory } from '@/types';

export function useUpload(uploadId: number) {
  return useQuery<UploadHistory>({
    queryKey: ['upload', uploadId],
    queryFn: () => getUpload(uploadId),
    enabled: !!uploadId,
  });
}

