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

export interface Customer {
  id: number;
  name: string;
  gender: string | null;
  age: number | null;
  credit_score: number | null;
  email: string | null;
  data_record_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CashFlow {
  id: number;
  sheet_id: number;
  item_name: string;
  item_type: string | null;
  total: number | null;
  monthly_average: number | null;
  monthly_data: Record<string, number> | null;
  data_record_id: number | null;
  created_at: string;
  updated_at: string;
}

// 뱅샐현황 관련 타입
export type {
  CashFlowItem,
  CashFlowData,
  FinancialAssetItem,
  FinancialStatusData,
  InsuranceItem,
  InsuranceStatusData,
  InvestmentItem,
  InvestmentStatusData,
  LoanItem,
  LoanStatusData,
} from '@/utils/bankStatusParser';

