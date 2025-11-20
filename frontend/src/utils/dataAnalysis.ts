/**
 * 데이터 분석 및 월별 집계 유틸리티 함수
 */

import { parseDate, extractMonthFromString, sortMonths } from './dateUtils';
import type { SheetWithData, DataRecord } from '@/types';

/**
 * 컬럼 감지 결과 인터페이스
 */
export interface DetectedColumns {
  dateColumnIndex: number | null;  // 날짜 컬럼 인덱스 (0부터 시작)
  amountColumnIndex: number | null; // 금액 컬럼 인덱스
  typeColumnIndex: number | null;   // 타입 컬럼 인덱스
}

/**
 * 월별 집계 결과 인터페이스
 */
export interface MonthlyAggregation {
  month: string;           // "YYYY-MM" 형식
  income: number;          // 수입 합계 (양수)
  expense: number;         // 지출 합계 (음수를 양수로 변환)
}

/**
 * 시트 데이터에서 컬럼을 자동 감지
 * @param data - 시트 데이터
 * @returns 감지된 컬럼 인덱스 정보
 */
export function detectColumns(data: SheetWithData): DetectedColumns {
  const result: DetectedColumns = {
    dateColumnIndex: null,
    amountColumnIndex: null,
    typeColumnIndex: null,
  };
  
  if (!data.records || data.records.length === 0) {
    return result;
  }
  
  // 첫 번째 행(헤더) 확인
  const headerRecord = data.records.find(r => r.row_index === 0);
  if (!headerRecord) {
    return result;
  }
  
  const headerValues = Object.entries(headerRecord.data);
  
  // 날짜 컬럼 감지
  const dateKeywords = ['날짜', 'date', '일자', '등록일', '발생일'];
  for (const [key, value] of headerValues) {
    const headerStr = String(value || '').toLowerCase();
    if (dateKeywords.some(keyword => headerStr.includes(keyword))) {
      result.dateColumnIndex = parseInt(key);
      
      // 실제 데이터에서 날짜 파싱 가능한지 확인
      const sampleRecord = data.records.find(r => r.row_index > 0);
      if (sampleRecord && sampleRecord.data[key]) {
        const parsedDate = parseDate(sampleRecord.data[key]);
        if (parsedDate) {
          break;
        }
      }
    }
  }
  
  // 날짜 컬럼을 찾지 못한 경우, 데이터로부터 자동 감지
  if (result.dateColumnIndex === null) {
    for (const [key] of headerValues) {
      const sampleRecord = data.records.find(r => r.row_index > 0);
      if (sampleRecord && sampleRecord.data[key]) {
        const parsedDate = parseDate(sampleRecord.data[key]);
        if (parsedDate) {
          result.dateColumnIndex = parseInt(key);
          break;
        }
      }
    }
  }
  
  // 금액 컬럼 감지
  const amountKeywords = ['금액', 'amount', '가격', '비용', '수입', '지출', '매출'];
  for (const [key, value] of headerValues) {
    const headerStr = String(value || '').toLowerCase();
    if (amountKeywords.some(keyword => headerStr.includes(keyword))) {
      result.amountColumnIndex = parseInt(key);
      
      // 실제 데이터에서 숫자 파싱 가능한지 확인
      const sampleRecord = data.records.find(r => r.row_index > 0);
      if (sampleRecord && sampleRecord.data[key]) {
        const amount = parseAmount(sampleRecord.data[key]);
        if (amount !== null) {
          break;
        }
      }
    }
  }
  
  // 금액 컬럼을 찾지 못한 경우, 숫자 데이터로부터 자동 감지
  if (result.amountColumnIndex === null) {
    for (const [key] of headerValues) {
      const sampleRecord = data.records.find(r => r.row_index > 0);
      if (sampleRecord && sampleRecord.data[key]) {
        const amount = parseAmount(sampleRecord.data[key]);
        if (amount !== null && Math.abs(amount) > 0) {
          result.amountColumnIndex = parseInt(key);
          break;
        }
      }
    }
  }
  
  // 타입 컬럼 감지
  const typeKeywords = ['타입', 'type', '구분', '분류', '종류'];
  for (const [key, value] of headerValues) {
    const headerStr = String(value || '').toLowerCase();
    if (typeKeywords.some(keyword => headerStr.includes(keyword))) {
      result.typeColumnIndex = parseInt(key);
      break;
    }
  }
  
  return result;
}

/**
 * 금액 문자열을 숫자로 변환
 * @param value - 금액 값 (숫자 또는 문자열)
 * @returns 변환된 숫자 또는 null (파싱 실패 시)
 */
export function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'number') {
    return value;
  }
  
  const str = String(value).trim();
  if (!str) return null;
  
  // 쉼표 제거 (1,234 -> 1234)
  const cleaned = str.replace(/,/g, '');
  
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  
  return num;
}

/**
 * 레코드가 이체 내역인지 확인
 * @param record - 데이터 레코드
 * @param typeColumnIndex - 타입 컬럼 인덱스
 * @returns 이체 내역이면 true
 */
export function isTransferRecord(record: DataRecord, typeColumnIndex: number | null): boolean {
  if (typeColumnIndex === null) return false;
  
  const typeValue = record.data[String(typeColumnIndex)];
  if (!typeValue) return false;
  
  const typeStr = String(typeValue).trim().toLowerCase();
  return typeStr === '이체' || typeStr === 'transfer';
}

/**
 * 시트 데이터를 월별로 집계
 * @param data - 시트 데이터
 * @param columns - 감지된 컬럼 정보
 * @returns 월별 집계 결과 배열
 */
export function aggregateByMonth(
  data: SheetWithData,
  columns: DetectedColumns
): MonthlyAggregation[] {
  if (columns.dateColumnIndex === null || columns.amountColumnIndex === null) {
    return [];
  }
  
  const monthMap = new Map<string, { income: number; expense: number }>();
  
  // 헤더 행 제외하고 데이터 행만 처리
  const dataRecords = data.records.filter(r => r.row_index > 0);
  
  for (const record of dataRecords) {
    // 이체 내역 제외
    if (isTransferRecord(record, columns.typeColumnIndex)) {
      continue;
    }
    
    // 날짜에서 월 추출
    const dateStr = record.data[String(columns.dateColumnIndex)];
    const month = extractMonthFromString(dateStr);
    if (!month) {
      continue; // 날짜 파싱 실패 시 제외
    }
    
    // 금액 파싱
    const amount = parseAmount(record.data[String(columns.amountColumnIndex)]);
    if (amount === null) {
      continue; // 금액 파싱 실패 시 제외
    }
    
    // 월별로 집계
    const monthData = monthMap.get(month) || { income: 0, expense: 0 };
    
    if (amount > 0) {
      monthData.income += amount;
    } else if (amount < 0) {
      monthData.expense += Math.abs(amount); // 지출은 양수로 변환하여 저장
    }
    
    monthMap.set(month, monthData);
  }
  
  // Map을 배열로 변환하고 월 순서대로 정렬
  const months = Array.from(monthMap.keys());
  const sortedMonths = sortMonths(months);
  
  return sortedMonths.map(month => ({
    month,
    income: monthMap.get(month)!.income,
    expense: monthMap.get(month)!.expense,
  }));
}

/**
 * 시트 데이터에서 월별 집계 수행
 * @param data - 시트 데이터
 * @returns 월별 집계 결과 배열 (집계 불가능한 경우 빈 배열)
 */
export function getMonthlyAggregation(data: SheetWithData): MonthlyAggregation[] {
  const columns = detectColumns(data);
  
  // 필요한 컬럼이 모두 감지되었는지 확인
  if (columns.dateColumnIndex === null || columns.amountColumnIndex === null) {
    return [];
  }
  
  return aggregateByMonth(data, columns);
}

