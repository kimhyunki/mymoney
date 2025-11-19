import { useQuery } from '@tanstack/react-query';
import { getSheetWithData } from '@/lib/api';
import type { SheetWithData } from '@/types';

export function useSheetData(sheetId: number | null) {
  return useQuery<SheetWithData>({
    queryKey: ['sheetData', sheetId],
    queryFn: () => getSheetWithData(sheetId!),
    enabled: !!sheetId,
  });
}

