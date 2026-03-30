export function formatNumber(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toLocaleString('ko-KR');
    }
    return value.toLocaleString('ko-KR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  const numValue = Number(value);
  if (!isNaN(numValue) && value !== '') {
    if (Number.isInteger(numValue)) {
      return numValue.toLocaleString('ko-KR');
    }
    return numValue.toLocaleString('ko-KR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
}
