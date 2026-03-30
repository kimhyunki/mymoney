import { useQuery } from '@tanstack/react-query';
import { getRealEstateAnalyses } from '@/lib/api';
import RealEstateCharts from './RealEstateCharts';

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

function RealEstateStatus() {
  const { data: analyses = [], isLoading, error } = useQuery({
    queryKey: ['realEstateAnalyses'],
    queryFn: () => getRealEstateAnalyses(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <h2 style={titleStyle}>부동산 수익분석</h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <h2 style={titleStyle}>부동산 수익분석</h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'rgba(186, 26, 26, 0.9)' }}>
          부동산 수익분석을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div style={cardStyle}>
        <h2 style={titleStyle}>부동산 수익분석</h2>
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          등록된 부동산 수익분석 데이터가 없습니다. Excel 파일을 업로드하면 자동으로 추출됩니다.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={titleStyle}>부동산 수익분석</h2>
      <RealEstateCharts analyses={analyses} />
      <div style={{ marginTop: 'var(--md-space-md)', paddingTop: 'var(--md-space-md)', borderTop: '1px solid var(--md-sys-light-outline-variant)' }}>
        <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'center', margin: 0 }}>
          부동산 수익분석은 30초마다 자동으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}

export default RealEstateStatus;
