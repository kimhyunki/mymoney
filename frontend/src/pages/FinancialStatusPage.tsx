import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getFinancialSnapshot } from '@/lib/api';

const fmt = (v: number | null | undefined) =>
  v == null ? '-' : Math.round(v).toLocaleString('ko-KR') + '원';

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(1) + '억';
  if (Math.abs(v) >= 1e4) return Math.round(v / 1e4).toLocaleString() + '만';
  return v.toLocaleString();
};

const COLORS = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#22c55e',
  '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#a855f7',
];

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: 'var(--md-space-lg)',
  boxShadow: 'var(--md-shadow-soft)',
};

const summaryCardStyle = (color: string): React.CSSProperties => ({
  ...cardStyle,
  borderLeft: `4px solid ${color}`,
  flex: 1,
  minWidth: 160,
});

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '6px 10px',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-label-small)',
  color: 'var(--md-sys-light-on-surface-variant)',
  backgroundColor: 'var(--md-sys-light-surface)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '5px 10px',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-body-small)',
  color: 'var(--md-sys-light-on-surface)',
};

const CATEGORY_LABELS: Record<string, string> = {
  '자유입출금 자산': '입출금',
  '현금 자산': '현금·신탁',
  '투자성 자산': '투자',
  '부동산': '부동산',
  '보험 자산': '보험',
  '연금 자산': '연금',
};

export default function FinancialStatusPage() {
  const { data: snap, isLoading, isError } = useQuery({
    queryKey: ['financial-snapshot'],
    queryFn: getFinancialSnapshot,
    refetchInterval: 30000,
  });

  if (isLoading) return <div style={{ padding: 'var(--md-space-lg)' }}>불러오는 중...</div>;
  if (isError || !snap) {
    return (
      <div style={{ padding: 'var(--md-space-lg)' }}>
        <h2 style={{ font: 'var(--md-headline-small)', margin: '0 0 8px' }}>재무 현황</h2>
        <p style={{ color: 'var(--md-sys-light-on-surface-variant)', font: 'var(--md-body-medium)' }}>
          데이터가 없습니다. Excel 가져오기 탭에서 뱅크샐러드 파일을 업로드하세요.
        </p>
      </div>
    );
  }

  const snapData = snap.snapshot_data ?? {};

  // _liabilities 등 배열이 아닌 키 제외, 자산 카테고리만 추출
  const assetEntries = Object.entries(snapData).filter(
    ([k, v]) => !k.startsWith('_') && Array.isArray(v)
  ) as [string, { name: string; amount: number }[]][];

  // 파이차트용 데이터 (카테고리별 합계)
  const pieData = assetEntries
    .map(([cat, items]) => ({
      name: CATEGORY_LABELS[cat] ?? cat,
      value: items.reduce((s, i) => s + i.amount, 0),
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const updatedAt = new Date(snap.updated_at).toLocaleString('ko-KR');

  return (
    <div style={{ padding: 'var(--md-space-lg)' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 'var(--md-space-lg)' }}>
        <h2 style={{ font: 'var(--md-headline-small)', margin: 0 }}>재무 현황</h2>
        <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 4, marginBottom: 0 }}>
          기준: {updatedAt}
        </p>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={summaryCardStyle('#6366f1')}>
          <p style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)', margin: '0 0 4px' }}>총자산</p>
          <p style={{ font: 'var(--md-title-large)', color: '#6366f1', margin: 0 }}>
            {snap.total_assets != null ? fmtShort(snap.total_assets) : '-'}
          </p>
          <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: '4px 0 0' }}>
            {fmt(snap.total_assets)}
          </p>
        </div>
        <div style={summaryCardStyle('#ef4444')}>
          <p style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)', margin: '0 0 4px' }}>총부채</p>
          <p style={{ font: 'var(--md-title-large)', color: '#ef4444', margin: 0 }}>
            {snap.total_liabilities != null ? fmtShort(snap.total_liabilities) : '-'}
          </p>
          <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: '4px 0 0' }}>
            {fmt(snap.total_liabilities)}
          </p>
        </div>
        <div style={summaryCardStyle('#22c55e')}>
          <p style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)', margin: '0 0 4px' }}>순자산</p>
          <p style={{ font: 'var(--md-title-large)', color: '#22c55e', margin: 0 }}>
            {snap.net_assets != null ? fmtShort(snap.net_assets) : '-'}
          </p>
          <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: '4px 0 0' }}>
            {fmt(snap.net_assets)}
          </p>
        </div>
      </div>

      {/* 차트 + 카테고리별 상세 */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* 파이차트 */}
        <div style={{ ...cardStyle, flex: '0 0 360px' }}>
          <h3 style={{ font: 'var(--md-title-medium)', margin: '0 0 12px' }}>자산 구성</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend formatter={(v) => v} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 카테고리별 상세 테이블 */}
        <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {assetEntries.map(([cat, items], ci) => {
            const total = items.reduce((s, i) => s + i.amount, 0);
            if (total === 0) return null;
            return (
              <div key={cat} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{
                    font: 'var(--md-label-large)',
                    margin: 0,
                    color: COLORS[ci % COLORS.length],
                  }}>
                    {cat}
                  </h4>
                  <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                    합계 {fmt(total)}
                  </span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>상품명</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items
                      .filter(item => item.amount > 0)
                      .sort((a, b) => b.amount - a.amount)
                      .map((item, ii) => (
                        <tr key={ii}>
                          <td style={tdStyle}>{item.name}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(item.amount)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
