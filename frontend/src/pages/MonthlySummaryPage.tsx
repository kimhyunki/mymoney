import MonthlySummaryStatus from '@/components/MonthlySummaryStatus';

export default function MonthlySummaryPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)' }}>
        <h1 style={{ font: 'var(--md-title-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
          월별 결산
        </h1>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-xs)' }}>
          월별 수입·지출·순수익·누적 순수익과 투자 원금 대비 평가금을 한눈에 확인합니다.
        </p>
      </header>
      <MonthlySummaryStatus />
    </div>
  );
}
