export interface Customer {
  id: number;
  name: string;
  gender: string | null;
  age: number | null;
  credit_score: number | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  name: string;
  gender?: string | null;
  age?: number | null;
  credit_score?: number | null;
  email?: string | null;
}

export interface CustomerUpdate {
  name?: string;
  gender?: string | null;
  age?: number | null;
  credit_score?: number | null;
  email?: string | null;
}

export interface CashFlow {
  id: number;
  item_name: string;
  item_type: string | null;
  total: number | null;
  monthly_average: number | null;
  monthly_data: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface CashFlowCreate {
  item_name: string;
  item_type?: string | null;
  total?: number | null;
  monthly_average?: number | null;
  monthly_data?: Record<string, number> | null;
}

export interface CashFlowUpdate {
  item_name?: string;
  item_type?: string | null;
  total?: number | null;
  monthly_average?: number | null;
  monthly_data?: Record<string, number> | null;
}

export interface FixedExpense {
  id: number;
  account_number: string | null;
  bank_name: string | null;
  account_holder: string | null;
  transfer_name: string | null;
  category: string;
  item_name: string;
  monthly_amount: number | null;
  monthly_data: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface FixedExpenseCreate {
  account_number?: string | null;
  bank_name?: string | null;
  account_holder?: string | null;
  transfer_name?: string | null;
  category: string;
  item_name: string;
  monthly_amount?: number | null;
  monthly_data?: Record<string, number> | null;
}

export interface FixedExpenseUpdate {
  account_number?: string | null;
  bank_name?: string | null;
  account_holder?: string | null;
  transfer_name?: string | null;
  category?: string;
  item_name?: string;
  monthly_amount?: number | null;
  monthly_data?: Record<string, number> | null;
}

export interface MonthlySummary {
  id: number;
  year: number;
  month: number;
  income: number | null;
  expense: number | null;
  net_income: number | null;
  cumulative_net_income: number | null;
  investment_principal: number | null;
  investment_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlySummaryCreate {
  year: number;
  month: number;
  income?: number | null;
  expense?: number | null;
  net_income?: number | null;
  cumulative_net_income?: number | null;
  investment_principal?: number | null;
  investment_value?: number | null;
}

export interface MonthlySummaryUpdate {
  year?: number;
  month?: number;
  income?: number | null;
  expense?: number | null;
  net_income?: number | null;
  cumulative_net_income?: number | null;
  investment_principal?: number | null;
  investment_value?: number | null;
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
  created_at: string;
  updated_at: string;
}

export interface FinancialGoalCreate {
  goal_name: string;
  target_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  interest_rate?: number | null;
  total_weeks?: number | null;
  elapsed_weeks?: number | null;
  remaining_weeks?: number | null;
  progress_rate?: number | null;
  weekly_allocation?: number | null;
  planned_data?: FinancialGoalItem[] | null;
  actual_data?: FinancialGoalItem[] | null;
}

export interface FinancialGoalUpdate {
  goal_name?: string;
  target_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  interest_rate?: number | null;
  total_weeks?: number | null;
  elapsed_weeks?: number | null;
  remaining_weeks?: number | null;
  progress_rate?: number | null;
  weekly_allocation?: number | null;
  planned_data?: FinancialGoalItem[] | null;
  actual_data?: FinancialGoalItem[] | null;
}

export interface RealEstateAnalysis {
  id: number;
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
  created_at: string;
  updated_at: string;
}

export interface RealEstateAnalysisCreate {
  property_name?: string | null;
  total_acquisition_cost?: number | null;
  self_capital?: number | null;
  loan_capital?: number | null;
  current_market_value?: number | null;
  unrealized_gain?: number | null;
  roe?: number | null;
  leverage_multiple?: number | null;
  acceleration_factor?: number | null;
  analysis_data?: Record<string, any> | null;
}

export interface RealEstateAnalysisUpdate extends RealEstateAnalysisCreate {}

export interface InvestmentStatus {
  id: number;
  investment_type: string | null;
  company: string | null;
  product_name: string;
  principal: number | null;
  current_value: number | null;
  return_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentStatusCreate {
  investment_type?: string | null;
  company?: string | null;
  product_name: string;
  principal?: number | null;
  current_value?: number | null;
  return_rate?: number | null;
}

export interface InvestmentStatusUpdate {
  investment_type?: string | null;
  company?: string | null;
  product_name?: string;
  principal?: number | null;
  current_value?: number | null;
  return_rate?: number | null;
}

export interface LedgerTransaction {
  id: number;
  transaction_date: string | null;
  transaction_time: string | null;
  transaction_type: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  amount: number | null;
  currency: string | null;
  payment_method: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerTransactionCreate {
  transaction_date?: string | null;
  transaction_time?: string | null;
  transaction_type?: string | null;
  category?: string | null;
  subcategory?: string | null;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  payment_method?: string | null;
  memo?: string | null;
}

export interface LedgerTransactionUpdate extends LedgerTransactionCreate {}

export interface FinancialSnapshotItem {
  name: string;
  amount: number;
}

export interface FinancialSnapshot {
  id: number;
  total_assets: number | null;
  total_liabilities: number | null;
  net_assets: number | null;
  snapshot_data: Record<string, FinancialSnapshotItem[]> | null;
  created_at: string;
  updated_at: string;
}

export interface UploadHistory {
  id: number;
  filename: string;
  file_size: number | null;
  result_json: Record<string, any> | null;
  created_at: string;
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
