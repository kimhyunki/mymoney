import FinancialGoalStatus from '@/components/FinancialGoalStatus';

export default function FinancialGoalPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)' }}>
        <h1 style={{ font: 'var(--md-title-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
          분양금 계획
        </h1>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-xs)' }}>
          분양금 납부 계획과 실제 집행 내역을 비교하고 진행률을 추적합니다.
        </p>
      </header>
      <FinancialGoalStatus />
    </div>
  );
}
