/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 날짜 문자열을 파싱하여 Date 객체로 변환
 * @param dateStr - 날짜 문자열 (ISO 형식 또는 일반 날짜 형식)
 * @returns Date 객체 또는 null (파싱 실패 시)
 */
export function parseDate(dateStr: unknown): Date | null {
  if (!dateStr) return null;
  
  const str = String(dateStr).trim();
  if (!str) return null;
  
  // ISO 형식: "2025-11-19T00:00:00" 또는 "2025-11-19T00:00:00.000Z"
  if (str.includes('T')) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // 일반 날짜 형식: "2025-11-19" 또는 "2025/11/19"
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{4}\.\d{2}\.\d{2}$/, // YYYY.MM.DD
  ];
  
  for (const pattern of datePatterns) {
    if (pattern.test(str)) {
      const date = new Date(str.replace(/[./]/g, '-'));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // 기본 파싱 시도
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

/**
 * Date 객체에서 YYYY-MM 형식의 월 문자열 추출
 * @param date - Date 객체
 * @returns "YYYY-MM" 형식의 문자열 또는 null
 */
export function extractMonth(date: Date | null): string | null {
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  return `${year}-${month}`;
}

/**
 * 날짜 문자열에서 월을 추출
 * @param dateStr - 날짜 문자열
 * @returns "YYYY-MM" 형식의 문자열 또는 null
 */
export function extractMonthFromString(dateStr: unknown): string | null {
  const date = parseDate(dateStr);
  return extractMonth(date);
}

/**
 * YYYY-MM 형식의 월 문자열을 "YYYY년 MM월" 형식으로 변환
 * @param monthStr - "YYYY-MM" 형식의 문자열
 * @returns "YYYY년 MM월" 형식의 문자열
 */
export function formatMonth(monthStr: string | null): string {
  if (!monthStr) return '';
  
  const [year, month] = monthStr.split('-');
  return `${year}년 ${month}월`;
}

/**
 * 월 문자열들을 시간순으로 정렬
 * @param months - "YYYY-MM" 형식의 문자열 배열
 * @returns 정렬된 월 배열
 */
export function sortMonths(months: string[]): string[] {
  return [...months].sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}

