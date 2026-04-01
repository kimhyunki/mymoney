import { useQuery } from '@tanstack/react-query';
import { getFinancialSnapshot } from '@/lib/api';
import { formatCurrency } from '@/utils/format';

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

const DANGER = '#ef4444';

export default function LoanPage() {
  const { data: snap, isLoading, isError } = useQuery({
    queryKey: ['financial-snapshot'],
    queryFn: getFinancialSnapshot,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--md-space-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-block',
          width: 16, height: 16,
          border: '2px solid var(--md-sys-light-outline-variant)',
          borderTopColor: DANGER,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          불러오는 중...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalLiabilities = snap?.total_liabilities ?? 0;
  const liabData = snap?.snapshot_data?._liabilities;
  const updatedAt = snap ? new Date(snap.updated_at).toLocaleString('ko-KR') : null;

  const categories = liabData ? Object.entries(liabData) : [];
  const totalItems = categories.reduce((s, [, items]) => s + items.length, 0);

  const hasLoans = categories.length > 0 && totalLiabilities > 0;

  return (
    <div style={{ padding: 'var(--md-space-lg)' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 'var(--md-space-lg)' }}>
        <h2 style={{ font: 'var(--md-headline-small)', margin: 0 }}>대출 현황</h2>
        {updatedAt && (
          <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 4, marginBottom: 0 }}>
            기준: {updatedAt}
          </p>
        )}
      </div>

      {isError || !snap ? (
        /* 데이터 없음 안내 */
        <div style={{
          ...cardStyle,
          maxWidth: 480,
          textAlign: 'center',
          padding: 'calc(var(--md-space-lg) * 2)',
          color: 'var(--md-sys-light-on-surface-variant)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p style={{ font: 'var(--md-title-medium)', margin: '0 0 8px' }}>데이터가 없습니다</p>
          <p style={{ font: 'var(--md-body-medium)', margin: 0 }}>
            Excel 가져오기 탭에서 뱅크샐러드 파일을 업로드하세요.
          </p>
        </div>
      ) : (
        <>
          {/* 총부채 요약 카드 */}
          <div style={{
            ...cardStyle,
            maxWidth: 280,
            borderLeft: `4px solid ${DANGER}`,
            marginBottom: 20,
          }}>
            <p style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)', margin: '0 0 4px' }}>총부채</p>
            <p style={{ font: 'var(--md-title-large)', color: DANGER, margin: 0 }}>
              {totalLiabilities > 0 ? formatCurrency(totalLiabilities) : '없음'}
            </p>
            {hasLoans && (
              <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: '4px 0 0' }}>
                총 {totalItems}건
              </p>
            )}
          </div>

          {/* 대출 상세 카드 */}
          <div style={{ ...cardStyle, maxWidth: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ font: 'var(--md-title-medium)', margin: 0 }}>대출 항목</h3>
              <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                총 {totalItems}건
              </span>
            </div>

            {!hasLoans ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', margin: 0 }}>
                  현재 대출이 없습니다.
                </p>
              </div>
            ) : (
              categories.map(([cat, items]) => {
                const catTotal = items.reduce((s, it) => s + it.amount, 0);
                return (
                  <div key={cat} style={{ marginBottom: 24 }}>
                    {/* 카테고리 헤더: 이름 + 소계 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 0 8px' }}>
                      <p style={{ font: 'var(--md-label-large)', color: DANGER, margin: 0 }}>{cat}</p>
                      <span style={{ font: 'var(--md-label-medium)', color: DANGER, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(catTotal)}
                      </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, width: 36 }}>#</th>
                          <th style={thStyle}>상품명</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>잔액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i}>
                            <td style={{ ...tdStyle, color: 'var(--md-sys-light-on-surface-variant)' }}>{i + 1}</td>
                            <td style={tdStyle}>{item.name}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
