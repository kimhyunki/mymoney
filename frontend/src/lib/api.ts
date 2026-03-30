import type { UploadHistory, SheetData, SheetWithData, UploadResponse, Customer, CashFlow, DataRecord, FixedExpense, MonthlySummary, FinancialGoal, RealEstateAnalysis } from '@/types';

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

    return response.json();
  } catch (error) {
    // 네트워크 에러나 CORS 에러 등
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`백엔드 서버에 연결할 수 없습니다. API URL: ${API_URL}${endpoint}`);
    }
    throw error;
  }
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // 대용량 파일 업로드를 위해 타임아웃을 길게 설정 (10분)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10분

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // FormData를 사용할 때는 Content-Type 헤더를 설정하지 않아야 브라우저가 자동으로 boundary를 설정합니다.
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // 타임아웃 에러
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('파일 업로드 시간이 초과되었습니다. 파일이 너무 크거나 네트워크 연결이 불안정합니다.');
    }
    // 네트워크 에러나 CORS 에러 등
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`백엔드 서버에 연결할 수 없습니다. API URL: ${API_URL}/api/upload`);
    }
    throw error;
  }
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

export async function getCustomers(): Promise<Customer[]> {
  return fetchAPI<Customer[]>('/api/customers');
}

export async function extractCustomerFromSheet(sheetId: number): Promise<Customer> {
  return fetchAPI<Customer>(`/api/sheets/${sheetId}/extract-customer`, {
    method: 'POST',
  });
}

export async function getCashFlows(sheetId?: number): Promise<CashFlow[]> {
  const url = sheetId 
    ? `/api/cash-flows?sheet_id=${sheetId}`
    : '/api/cash-flows';
  return fetchAPI<CashFlow[]>(url);
}

export async function extractCashFlowsFromSheet(sheetId: number): Promise<CashFlow[]> {
  return fetchAPI<CashFlow[]>(`/api/sheets/${sheetId}/extract-cash-flows`, {
    method: 'POST',
  });
}

export async function getRecordsByIds(recordIds: number[]): Promise<DataRecord[]> {
  return fetchAPI<DataRecord[]>('/api/data-records/by-ids', {
    method: 'POST',
    body: JSON.stringify(recordIds),
  });
}

export async function getFixedExpenses(sheetId?: number): Promise<FixedExpense[]> {
  const url = sheetId ? `/api/fixed-expenses?sheet_id=${sheetId}` : '/api/fixed-expenses';
  return fetchAPI<FixedExpense[]>(url);
}

export async function extractFixedExpensesFromSheet(sheetId: number): Promise<FixedExpense[]> {
  return fetchAPI<FixedExpense[]>(`/api/sheets/${sheetId}/extract-fixed-expenses`, {
    method: 'POST',
  });
}

export async function getMonthlySummaries(year?: number): Promise<MonthlySummary[]> {
  const url = year ? `/api/monthly-summaries?year=${year}` : '/api/monthly-summaries';
  return fetchAPI<MonthlySummary[]>(url);
}

export async function extractMonthlySummaryFromSheet(sheetId: number): Promise<MonthlySummary[]> {
  return fetchAPI<MonthlySummary[]>(`/api/sheets/${sheetId}/extract-monthly-summary`, {
    method: 'POST',
  });
}

export async function getFinancialGoals(): Promise<FinancialGoal[]> {
  return fetchAPI<FinancialGoal[]>('/api/financial-goals');
}

export async function extractFinancialGoalFromSheet(sheetId: number): Promise<FinancialGoal> {
  return fetchAPI<FinancialGoal>(`/api/sheets/${sheetId}/extract-financial-goal`, {
    method: 'POST',
  });
}

export async function getRealEstateAnalyses(): Promise<RealEstateAnalysis[]> {
  return fetchAPI<RealEstateAnalysis[]>('/api/real-estate-analyses');
}

export async function extractRealEstateFromSheet(sheetId: number): Promise<RealEstateAnalysis> {
  return fetchAPI<RealEstateAnalysis>(`/api/sheets/${sheetId}/extract-real-estate`, {
    method: 'POST',
  });
}

