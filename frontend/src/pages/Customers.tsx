import CustomerInfo from '@/components/CustomerInfo';

export default function Customers() {
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
          고객 정보
        </h1>
        <p
          style={{
            font: 'var(--md-body-medium)',
            color: 'var(--md-sys-light-on-surface-variant)',
          }}
        >
          엑셀 파일에서 추출된 고객 정보를 확인하세요
        </p>
      </header>

      <CustomerInfo />
    </div>
  );
}

