import type { UploadHistory, SheetData, SheetWithData, UploadResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getUploads(): Promise<UploadHistory[]> {
  return fetchAPI<UploadHistory[]>('/api/uploads');
}

export async function getUpload(uploadId: number): Promise<UploadHistory> {
  return fetchAPI<UploadHistory>(`/api/uploads/${uploadId}`);
}

export async function getSheets(uploadId: number): Promise<SheetData[]> {
  return fetchAPI<SheetData[]>(`/api/uploads/${uploadId}/sheets`);
}

export async function getSheetWithData(sheetId: number): Promise<SheetWithData> {
  return fetchAPI<SheetWithData>(`/api/sheets/${sheetId}`);
}

