import { useQuery } from '@tanstack/react-query';
import { getUploads } from '@/lib/api';
import type { UploadHistory } from '@/types';

export function useUploads() {
  return useQuery<UploadHistory[]>({
    queryKey: ['uploads'],
    queryFn: getUploads,
  });
}

