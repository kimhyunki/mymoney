/**
 * 뱅샐현황 시트 데이터 파싱 유틸리티
 */

import type { SheetWithData } from '@/types';

export interface CashFlowItem {
  name: string;
  total: number;
  monthlyAverage: number;
  monthlyData: Record<string, number>; // 월별 데이터 (예: "2024-11": 1000000)
}

export interface CashFlowData {
  income: CashFlowItem[];
  expense: CashFlowItem[];
  months: string[]; // 월 목록
}

export interface FinancialAssetItem {
  category: string; // 자산 유형 (예: "자유입출금 자산")
  productName: string;
  amount: number;
}

export interface FinancialStatusData {
  assets: FinancialAssetItem[];
  liabilities: FinancialAssetItem[];
}

export interface InsuranceItem {
  company: string;
  name: string;
  status: string;
  totalPaid: number;
  contractDate: string;
  maturityDate: string;
}

export interface InsuranceStatusData {
  items: InsuranceItem[];
}

export interface InvestmentItem {
  type: string; // 투자상품종류
  company: string;
  productName: string;
  principal: number;
  currentValue: number;
  returnRate: number;
  startDate?: string;
  maturityDate?: string;
}

export interface InvestmentStatusData {
  items: InvestmentItem[];
}

export interface LoanItem {
  type: string; // 대출종류
  company: string;
  productName: string;
  principal: number;
  balance: number;
  interestRate: number;
  startDate?: string;
  maturityDate?: string;
}

export interface LoanStatusData {
  items: LoanItem[];
}

/**
 * 숫자 값 파싱
 */
function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * 현금흐름현황 파싱
 */
export function parseCashFlow(data: SheetWithData): CashFlowData | null {
  const records = data.records;
  if (!records || records.length === 0) return null;

  // 현금흐름현황 섹션 찾기 (row_index 4부터 시작)
  const sectionStartIndex = records.findIndex(
    (r) => r.row_index >= 4 && String(r.data['1'] || '').includes('현금흐름현황')
  );
  if (sectionStartIndex === -1) return null;

  // 헤더 행 찾기 (row_index 6)
  const headerRecord = records.find((r) => r.row_index === 6);
  if (!headerRecord) return null;

  // 월 컬럼 인덱스 찾기 (2024-11, 2024-12 등)
  const months: string[] = [];
  const monthColumnIndices: number[] = [];
  for (let i = 4; i <= 16; i++) {
    const headerValue = String(headerRecord.data[String(i)] || '').trim();
    if (headerValue && /^\d{4}-\d{2}$/.test(headerValue)) {
      months.push(headerValue);
      monthColumnIndices.push(i);
    }
  }

  const income: CashFlowItem[] = [];
  const expense: CashFlowItem[] = [];
  const incomeItems = ['금융수입', '급여', '기타수입', '사업수입', '상여금', '앱테크', '용돈'];
  const expenseItems = [
    '경조/선물',
    '교육/학습',
    '교통',
    '금융',
    '문화/여가',
    '뷰티/미용',
    '생활',
    '식비',
    '여행/숙박',
    '온라인쇼핑',
    '의료/건강',
    '자녀/육아',
    '자동차',
    '주거/통신',
    '카페/간식',
    '패션/쇼핑',
  ];

  // 데이터 행 처리 (row_index 7부터)
  for (let i = 7; i <= 32; i++) {
    const record = records.find((r) => r.row_index === i);
    if (!record) continue;

    const itemName = String(record.data['1'] || '').trim();
    if (!itemName || itemName === '월수입 총계' || itemName === '월지출 총계' || itemName === '순수입 총계') {
      continue;
    }

    const total = parseNumber(record.data['2']);
    const monthlyAverage = parseNumber(record.data['3']);
    const monthlyData: Record<string, number> = {};

    monthColumnIndices.forEach((colIdx, idx) => {
      const month = months[idx];
      monthlyData[month] = parseNumber(record.data[String(colIdx)]);
    });

    const item: CashFlowItem = {
      name: itemName,
      total,
      monthlyAverage,
      monthlyData,
    };

    if (incomeItems.includes(itemName)) {
      income.push(item);
    } else if (expenseItems.includes(itemName)) {
      expense.push(item);
    }
  }

  return { income, expense, months };
}

/**
 * 재무현황 파싱
 */
export function parseFinancialStatus(data: SheetWithData): FinancialStatusData | null {
  const records = data.records;
  if (!records || records.length === 0) return null;

  // 재무현황 섹션 찾기
  const sectionStartIndex = records.findIndex(
    (r) => r.row_index >= 33 && String(r.data['1'] || '').includes('재무현황')
  );
  if (sectionStartIndex === -1) return null;

  const assets: FinancialAssetItem[] = [];
  const liabilities: FinancialAssetItem[] = [];

  let currentCategory = '';
  let isAssetSection = true;

  // row_index 36부터 데이터 시작
  for (let i = 36; i <= 113; i++) {
    const record = records.find((r) => r.row_index === i);
    if (!record) continue;

    const col1 = String(record.data['1'] || '').trim();
    const col2 = String(record.data['2'] || '').trim();
    const col4 = parseNumber(record.data['4']);
    const col8 = parseNumber(record.data['8']);

    // 섹션 구분 확인
    if (col1 === '부채') {
      isAssetSection = false;
      continue;
    }

    // 자산/부채 카테고리 확인
    if (col1 && !col2 && col4 === 0 && col8 === 0) {
      // 카테고리 헤더인 경우
      if (col1 !== '항목' && col1 !== '자산' && col1 !== '부채') {
        currentCategory = col1;
      }
      continue;
    }

    // 데이터 행 처리
    if (col2 && (col4 > 0 || col8 > 0)) {
      const item: FinancialAssetItem = {
        category: currentCategory || (isAssetSection ? '기타 자산' : '기타 부채'),
        productName: col2,
        amount: isAssetSection ? col4 : col8,
      };

      if (isAssetSection) {
        assets.push(item);
      } else {
        liabilities.push(item);
      }
    }
  }

  return { assets, liabilities };
}

/**
 * 보험현황 파싱
 */
export function parseInsuranceStatus(data: SheetWithData): InsuranceStatusData | null {
  const records = data.records;
  if (!records || records.length === 0) return null;

  // 보험현황 섹션 찾기
  const sectionStartIndex = records.findIndex(
    (r) => r.row_index >= 114 && String(r.data['1'] || '').includes('보험현황')
  );
  if (sectionStartIndex === -1) return null;

  const items: InsuranceItem[] = [];

  // row_index 117부터 데이터 시작 (헤더는 116)
  for (let i = 117; i <= 128; i++) {
    const record = records.find((r) => r.row_index === i);
    if (!record) continue;

    const company = String(record.data['1'] || '').trim();
    const name = String(record.data['2'] || '').trim();
    const status = String(record.data['4'] || '').trim();
    const totalPaid = parseNumber(record.data['5']);
    const contractDate = String(record.data['6'] || '').trim();
    const maturityDate = String(record.data['7'] || '').trim();

    // 총계 행은 제외
    if (company === '총계' || !company || !name) continue;

    items.push({
      company,
      name,
      status,
      totalPaid,
      contractDate,
      maturityDate,
    });
  }

  return { items };
}

/**
 * 투자현황 파싱
 */
export function parseInvestmentStatus(data: SheetWithData): InvestmentStatusData | null {
  const records = data.records;
  if (!records || records.length === 0) return null;

  // 투자현황 섹션 찾기
  const sectionStartIndex = records.findIndex(
    (r) => r.row_index >= 129 && String(r.data['1'] || '').includes('투자현황')
  );
  if (sectionStartIndex === -1) return null;

  const items: InvestmentItem[] = [];

  // row_index 132부터 데이터 시작 (헤더는 131)
  for (let i = 132; i <= 147; i++) {
    const record = records.find((r) => r.row_index === i);
    if (!record) continue;

    const type = String(record.data['1'] || '').trim();
    const company = String(record.data['2'] || '').trim();
    const productName = String(record.data['3'] || '').trim();
    const principal = parseNumber(record.data['5']);
    const currentValue = parseNumber(record.data['6']);
    const returnRate = parseNumber(record.data['7']);
    const startDate = String(record.data['8'] || '').trim() || undefined;
    const maturityDate = String(record.data['9'] || '').trim() || undefined;

    // 총계 행은 제외
    if (type === '총계' || !type || !productName) continue;

    items.push({
      type,
      company,
      productName,
      principal,
      currentValue,
      returnRate,
      startDate,
      maturityDate,
    });
  }

  return { items };
}

/**
 * 대출현황 파싱
 */
export function parseLoanStatus(data: SheetWithData): LoanStatusData | null {
  const records = data.records;
  if (!records || records.length === 0) return null;

  // 대출현황 섹션 찾기
  const sectionStartIndex = records.findIndex(
    (r) => r.row_index >= 148 && String(r.data['1'] || '').includes('대출현황')
  );
  if (sectionStartIndex === -1) return null;

  const items: LoanItem[] = [];

  // row_index 151부터 데이터 시작 (헤더는 150)
  for (let i = 151; i <= 152; i++) {
    const record = records.find((r) => r.row_index === i);
    if (!record) continue;

    const type = String(record.data['1'] || '').trim();
    const company = String(record.data['2'] || '').trim();
    const productName = String(record.data['3'] || '').trim();
    const principal = parseNumber(record.data['5']);
    const balance = parseNumber(record.data['6']);
    const interestRate = parseNumber(record.data['7']);
    const startDate = String(record.data['8'] || '').trim() || undefined;
    const maturityDate = String(record.data['9'] || '').trim() || undefined;

    // 총계 행은 제외
    if (type === '총계' || !type || !productName) continue;

    items.push({
      type,
      company,
      productName,
      principal,
      balance,
      interestRate,
      startDate,
      maturityDate,
    });
  }

  return { items };
}

