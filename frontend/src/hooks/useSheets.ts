import { useQuery } from '@tanstack/react-query';
import { getSheets } from '@/lib/api';
import type { SheetData } from '@/types';

export function useSheets(uploadId: number) {
  return useQuery<SheetData[]>({
    queryKey: ['sheets', uploadId],
    queryFn: () => getSheets(uploadId),
    enabled: !!uploadId,
  });
}

