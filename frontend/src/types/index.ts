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
  upload_id: number | null;
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
  upload_id: number | null;
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

export interface FixedExpense {
  id: number;
  sheet_id: number;
  account_number: string | null;
  bank_name: string | null;
  account_holder: string | null;
  transfer_name: string | null;
  category: string;
  item_name: string;
  monthly_amount: number | null;
  monthly_data: Record<string, number> | null;
  upload_id: number | null;
  data_record_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlySummary {
  id: number;
  sheet_id: number;
  year: number;
  month: number;
  income: number | null;
  expense: number | null;
  net_income: number | null;
  cumulative_net_income: number | null;
  investment_principal: number | null;
  investment_value: number | null;
  upload_id: number | null;
  data_record_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoalItem {
  date: string | null;
  category: string | null;
  item: string;
  amount: number;
  balance: number | null;
}

export interface FinancialGoal {
  id: number;
  sheet_id: number;
  goal_name: string;
  target_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  interest_rate: number | null;
  total_weeks: number | null;
  elapsed_weeks: number | null;
  remaining_weeks: number | null;
  progress_rate: number | null;
  weekly_allocation: number | null;
  planned_data: FinancialGoalItem[] | null;
  actual_data: FinancialGoalItem[] | null;
  upload_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface RealEstateAnalysis {
  id: number;
  sheet_id: number;
  property_name: string | null;
  total_acquisition_cost: number | null;
  self_capital: number | null;
  loan_capital: number | null;
  current_market_value: number | null;
  unrealized_gain: number | null;
  roe: number | null;
  leverage_multiple: number | null;
  acceleration_factor: number | null;
  analysis_data: Record<string, any> | null;
  upload_id: number | null;
  data_record_id: number | null;
  created_at: string;
  updated_at: string;
}

// 차트 상세 정보 모달 관련 타입
export interface ChartDetailData {
  title: string;
  label?: string;
  value?: number | string;
  month?: string;
  itemName?: string;
  category?: string;
  records: DataRecord[];
}

