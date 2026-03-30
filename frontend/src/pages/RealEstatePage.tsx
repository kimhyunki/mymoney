import RealEstateStatus from '@/components/RealEstateStatus';

export default function RealEstatePage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)' }}>
        <h1 style={{ font: 'var(--md-title-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
          부동산 수익분석
        </h1>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-xs)' }}>
          부동산 자산의 취득원가, 시세차익, ROE, 레버리지 배수를 분석합니다.
        </p>
      </header>
      <RealEstateStatus />
    </div>
  );
}
