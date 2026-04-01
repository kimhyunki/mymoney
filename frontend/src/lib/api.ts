import type {
  Customer, CustomerCreate, CustomerUpdate,
  CashFlow, CashFlowCreate, CashFlowUpdate,
  FixedExpense, FixedExpenseCreate, FixedExpenseUpdate,
  MonthlySummary, MonthlySummaryCreate, MonthlySummaryUpdate,
  FinancialGoal, FinancialGoalCreate, FinancialGoalUpdate,
  RealEstateAnalysis, RealEstateAnalysisCreate, RealEstateAnalysisUpdate,
  InvestmentStatus, InvestmentStatusCreate, InvestmentStatusUpdate,
  FinancialSnapshot,
  LedgerTransaction, LedgerTransactionCreate, LedgerTransactionUpdate,
  UploadHistory,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8051';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
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

    // DELETE 등 본문이 없는 응답 처리
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`백엔드 서버에 연결할 수 없습니다. API URL: ${API_URL}${endpoint}`);
    }
    throw error;
  }
}

// ── Customer ─────────────────────────────────────────────────
export const getCustomers = (): Promise<Customer[]> =>
  fetchAPI('/api/customers');

export const createCustomer = (data: CustomerCreate): Promise<Customer> =>
  fetchAPI('/api/customers', { method: 'POST', body: JSON.stringify(data) });

export const updateCustomer = (id: number, data: CustomerUpdate): Promise<Customer> =>
  fetchAPI(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCustomer = (id: number): Promise<void> =>
  fetchAPI(`/api/customers/${id}`, { method: 'DELETE' });

// ── CashFlow ──────────────────────────────────────────────────
export const getCashFlows = (): Promise<CashFlow[]> =>
  fetchAPI('/api/cash-flows');

export const createCashFlow = (data: CashFlowCreate): Promise<CashFlow> =>
  fetchAPI('/api/cash-flows', { method: 'POST', body: JSON.stringify(data) });

export const updateCashFlow = (id: number, data: CashFlowUpdate): Promise<CashFlow> =>
  fetchAPI(`/api/cash-flows/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCashFlow = (id: number): Promise<void> =>
  fetchAPI(`/api/cash-flows/${id}`, { method: 'DELETE' });

// ── FixedExpense ──────────────────────────────────────────────
export const getFixedExpenses = (): Promise<FixedExpense[]> =>
  fetchAPI('/api/fixed-expenses');

export const createFixedExpense = (data: FixedExpenseCreate): Promise<FixedExpense> =>
  fetchAPI('/api/fixed-expenses', { method: 'POST', body: JSON.stringify(data) });

export const updateFixedExpense = (id: number, data: FixedExpenseUpdate): Promise<FixedExpense> =>
  fetchAPI(`/api/fixed-expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteFixedExpense = (id: number): Promise<void> =>
  fetchAPI(`/api/fixed-expenses/${id}`, { method: 'DELETE' });

// ── MonthlySummary ────────────────────────────────────────────
export const getMonthlySummaries = (year?: number): Promise<MonthlySummary[]> =>
  fetchAPI(year ? `/api/monthly-summaries?year=${year}` : '/api/monthly-summaries');

export const createMonthlySummary = (data: MonthlySummaryCreate): Promise<MonthlySummary> =>
  fetchAPI('/api/monthly-summaries', { method: 'POST', body: JSON.stringify(data) });

export const updateMonthlySummary = (id: number, data: MonthlySummaryUpdate): Promise<MonthlySummary> =>
  fetchAPI(`/api/monthly-summaries/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteMonthlySummary = (id: number): Promise<void> =>
  fetchAPI(`/api/monthly-summaries/${id}`, { method: 'DELETE' });

// ── FinancialGoal ─────────────────────────────────────────────
export const getFinancialGoals = (): Promise<FinancialGoal[]> =>
  fetchAPI('/api/financial-goals');

export const createFinancialGoal = (data: FinancialGoalCreate): Promise<FinancialGoal> =>
  fetchAPI('/api/financial-goals', { method: 'POST', body: JSON.stringify(data) });

export const updateFinancialGoal = (id: number, data: FinancialGoalUpdate): Promise<FinancialGoal> =>
  fetchAPI(`/api/financial-goals/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteFinancialGoal = (id: number): Promise<void> =>
  fetchAPI(`/api/financial-goals/${id}`, { method: 'DELETE' });

// ── RealEstateAnalysis ────────────────────────────────────────
export const getRealEstateAnalyses = (): Promise<RealEstateAnalysis[]> =>
  fetchAPI('/api/real-estate-analyses');

export const createRealEstateAnalysis = (data: RealEstateAnalysisCreate): Promise<RealEstateAnalysis> =>
  fetchAPI('/api/real-estate-analyses', { method: 'POST', body: JSON.stringify(data) });

export const updateRealEstateAnalysis = (id: number, data: RealEstateAnalysisUpdate): Promise<RealEstateAnalysis> =>
  fetchAPI(`/api/real-estate-analyses/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteRealEstateAnalysis = (id: number): Promise<void> =>
  fetchAPI(`/api/real-estate-analyses/${id}`, { method: 'DELETE' });

// ── InvestmentStatus ──────────────────────────────────────────
export const getInvestmentStatuses = (): Promise<InvestmentStatus[]> =>
  fetchAPI('/api/investment-statuses');

export const createInvestmentStatus = (data: InvestmentStatusCreate): Promise<InvestmentStatus> =>
  fetchAPI('/api/investment-statuses', { method: 'POST', body: JSON.stringify(data) });

export const updateInvestmentStatus = (id: number, data: InvestmentStatusUpdate): Promise<InvestmentStatus> =>
  fetchAPI(`/api/investment-statuses/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteInvestmentStatus = (id: number): Promise<void> =>
  fetchAPI(`/api/investment-statuses/${id}`, { method: 'DELETE' });

// ── FinancialSnapshot ─────────────────────────────────────────
export const getFinancialSnapshot = (): Promise<FinancialSnapshot | null> =>
  fetchAPI('/api/financial-snapshot');

// ── LedgerTransaction ─────────────────────────────────────────
export const getLedgerTransactions = (params?: { transaction_type?: string; category?: string }): Promise<LedgerTransaction[]> => {
  const query = new URLSearchParams();
  if (params?.transaction_type) query.set('transaction_type', params.transaction_type);
  if (params?.category) query.set('category', params.category);
  const qs = query.toString();
  return fetchAPI(`/api/ledger-transactions${qs ? `?${qs}` : ''}`);
};

export const createLedgerTransaction = (data: LedgerTransactionCreate): Promise<LedgerTransaction> =>
  fetchAPI('/api/ledger-transactions', { method: 'POST', body: JSON.stringify(data) });

export const updateLedgerTransaction = (id: number, data: LedgerTransactionUpdate): Promise<LedgerTransaction> =>
  fetchAPI(`/api/ledger-transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteLedgerTransaction = (id: number): Promise<void> =>
  fetchAPI(`/api/ledger-transactions/${id}`, { method: 'DELETE' });

export type ImportBanksaladResult = {
  customer: { updated: number; inserted: number };
  cash_flow: { updated: number; inserted: number };
  monthly_summary: { updated: number; inserted: number };
  investment: { updated: number; inserted: number };
  financial_snapshot: { updated: number; inserted: number };
  ledger: { inserted: number; skipped: number };
};

export const importBanksaladExcel = (file: File): Promise<ImportBanksaladResult> => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_URL}/api/import/banksalad-excel`, {
    method: 'POST',
    body: formData,
  }).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? '가져오기 실패');
    }
    return res.json();
  });
};

export const getUploadHistory = (): Promise<UploadHistory[]> =>
  fetchAPI('/api/upload-history');

export const uploadLedgerExcel = (file: File): Promise<{ inserted: number; skipped: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_URL}/api/ledger-transactions/import-excel`, {
    method: 'POST',
    body: formData,
  }).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? 'Excel 업로드 실패');
    }
    return res.json();
  });
};
