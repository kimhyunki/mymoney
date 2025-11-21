import { useQuery } from '@tanstack/react-query';
import { getCashFlows } from '@/lib/api';
import CashFlowCharts from './CashFlowCharts';

function CashFlowStatus() {
  const { data: cashFlows = [], isLoading, error } = useQuery({
    queryKey: ['cashFlows'],
    queryFn: () => getCashFlows(),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
          boxShadow: 'var(--md-shadow-soft)',
        }}
      >
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
          현금 흐름 현황
        </h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
          boxShadow: 'var(--md-shadow-soft)',
        }}
      >
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
          현금 흐름 현황
        </h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'rgba(186, 26, 26, 0.9)' }}>
          현금 흐름 현황을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (cashFlows.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
          boxShadow: 'var(--md-shadow-soft)',
        }}
      >
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
          현금 흐름 현황
        </h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          등록된 현금 흐름 현황이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--md-sys-light-surface-container)',
        borderRadius: 'var(--md-radius-lg)',
        border: '1px solid var(--md-sys-light-outline-variant)',
        padding: 'var(--md-space-lg)',
        boxShadow: 'var(--md-shadow-soft)',
      }}
    >
      <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
        현금 흐름 현황
      </h2>
      <CashFlowCharts cashFlows={cashFlows} />
      <div style={{ marginTop: 'var(--md-space-md)', paddingTop: 'var(--md-space-md)', borderTop: '1px solid var(--md-sys-light-outline-variant)' }}>
        <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'center', margin: 0 }}>
          현금 흐름 현황은 30초마다 자동으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}

export default CashFlowStatus;

