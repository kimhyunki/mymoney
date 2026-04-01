import { useQuery } from '@tanstack/react-query';
import { getFinancialSnapshot } from '@/lib/api';

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: 'var(--md-space-lg)',
  boxShadow: 'var(--md-shadow-soft)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 12px',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-label-small)',
  color: 'var(--md-sys-light-on-surface-variant)',
  backgroundColor: 'var(--md-sys-light-surface)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 12px',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-body-small)',
  color: 'var(--md-sys-light-on-surface)',
};

export default function InsurancePage() {
  const { data: snap, isLoading, isError } = useQuery({
    queryKey: ['financial-snapshot'],
    queryFn: getFinancialSnapshot,
    refetchInterval: 30000,
  });

  if (isLoading) return <div style={{ padding: 'var(--md-space-lg)' }}>불러오는 중...</div>;

  const items = snap?.snapshot_data?.['보험 자산'] ?? [];
  const updatedAt = snap ? new Date(snap.updated_at).toLocaleString('ko-KR') : null;

  return (
    <div style={{ padding: 'var(--md-space-lg)' }}>
      <div style={{ marginBottom: 'var(--md-space-lg)' }}>
        <h2 style={{ font: 'var(--md-headline-small)', margin: 0 }}>보험 현황</h2>
        {updatedAt && (
          <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 4, marginBottom: 0 }}>
            기준: {updatedAt}
          </p>
        )}
      </div>

      {isError || !snap ? (
        <p style={{ color: 'var(--md-sys-light-on-surface-variant)', font: 'var(--md-body-medium)' }}>
          데이터가 없습니다. Excel 가져오기 탭에서 뱅크샐러드 파일을 업로드하세요.
        </p>
      ) : (
        <div style={{ ...cardStyle, maxWidth: 720 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ font: 'var(--md-title-medium)', margin: 0 }}>보험 자산 목록</h3>
            <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
              총 {items.length}건
            </span>
          </div>

          {items.length === 0 ? (
            <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', margin: 0 }}>
              등록된 보험 자산이 없습니다.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>상품명</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>해지환급금</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, color: 'var(--md-sys-light-on-surface-variant)', width: 36 }}>{i + 1}</td>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {item.amount > 0
                        ? Math.round(item.amount).toLocaleString('ko-KR') + '원'
                        : <span style={{ color: 'var(--md-sys-light-on-surface-variant)' }}>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 12, marginBottom: 0 }}>
            * 해지환급금은 뱅크샐러드 기준이며, 실제 보험가치와 다를 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
