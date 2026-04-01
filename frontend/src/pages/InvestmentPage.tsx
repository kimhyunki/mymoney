import InvestmentStatusComponent from '@/components/InvestmentStatus';

export default function InvestmentPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)' }}>
        <h1 style={{ font: 'var(--md-title-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
          투자 현황
        </h1>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-xs)' }}>
          보유 투자상품의 원금, 평가금액, 수익률을 분석합니다.
        </p>
      </header>
      <InvestmentStatusComponent />
    </div>
  );
}
