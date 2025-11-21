import CashFlowStatus from '@/components/CashFlowStatus';

export default function CashFlow() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)' }}>
        <h1
          style={{
            font: 'var(--md-title-large)',
            color: 'var(--md-sys-light-on-surface)',
            marginBottom: 'var(--md-space-sm)',
          }}
        >
          현금 흐름 현황
        </h1>
        <p
          style={{
            font: 'var(--md-body-medium)',
            color: 'var(--md-sys-light-on-surface-variant)',
          }}
        >
          엑셀 파일에서 추출된 현금 흐름 데이터를 차트로 확인하세요
        </p>
      </header>

      <CashFlowStatus />
    </div>
  );
}

