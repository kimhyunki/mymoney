export interface UploadHistory {
  id: number;
  filename: string;
  uploaded_at: string;
  sheet_count: number;
}

export interface SheetData {
  id: number;
  upload_id: number;
  sheet_name: string;
  row_count: number;
  column_count: number;
}

export interface DataRecord {
  id: number;
  sheet_id: number;
  row_index: number;
  data: Record<string, any>;
}

export interface SheetWithData {
  sheet: SheetData;
  records: DataRecord[];
}

export interface UploadResponse {
  upload_id: number;
  filename: string;
  sheet_count: number;
  message: string;
}

