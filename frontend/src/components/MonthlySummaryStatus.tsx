import { useQuery } from '@tanstack/react-query';
import { getMonthlySummaries } from '@/lib/api';
import MonthlySummaryCharts from './MonthlySummaryCharts';

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: 'var(--md-space-lg)',
  boxShadow: 'var(--md-shadow-soft)',
};

const titleStyle: React.CSSProperties = {
  font: 'var(--md-title-small)',
  color: 'var(--md-sys-light-on-surface)',
  marginBottom: 'var(--md-space-md)',
};

function MonthlySummaryStatus() {
  const { data: summaries = [], isLoading, error } = useQuery({
    queryKey: ['monthlySummaries'],
    queryFn: () => getMonthlySummaries(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <h2 style={titleStyle}>월별 결산</h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <h2 style={titleStyle}>월별 결산</h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'rgba(186, 26, 26, 0.9)' }}>
          월별 결산을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div style={cardStyle}>
        <h2 style={titleStyle}>월별 결산</h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          등록된 월별 결산 데이터가 없습니다. Excel 파일을 업로드하면 자동으로 추출됩니다.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={titleStyle}>월별 결산</h2>
      <MonthlySummaryCharts summaries={summaries} />
      <div style={{ marginTop: 'var(--md-space-md)', paddingTop: 'var(--md-space-md)', borderTop: '1px solid var(--md-sys-light-outline-variant)' }}>
        <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'center', margin: 0 }}>
          월별 결산은 30초마다 자동으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}

export default MonthlySummaryStatus;
