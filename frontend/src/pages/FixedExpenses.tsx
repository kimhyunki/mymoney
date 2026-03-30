import FixedExpenseStatus from '@/components/FixedExpenseStatus';

export default function FixedExpenses() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)' }}>
        <h1 style={{ font: 'var(--md-title-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
          고정비 현황
        </h1>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-xs)' }}>
          성향(저축·용돈·보험 등)별 고정 지출 항목과 월별 금액을 관리합니다.
        </p>
      </header>
      <FixedExpenseStatus />
    </div>
  );
}
