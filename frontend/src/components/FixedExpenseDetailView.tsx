import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { FixedExpense } from '@/types';
import { SummaryCard } from './MonthDetailView';
import { formatCurrency } from '@/utils/format';

// ── 차트 유틸 ─────────────────────────────────────────────────
function fmtAxis(v: number): string {
  if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억`;
  if (Math.abs(v) >= 10_000_000) return `${(v / 10_000_000).toFixed(0)}천만`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function fmtAmount(v: number): string {
  if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억원`;
  if (Math.abs(v) >= 10_000_000) return `${(v / 10_000_000).toFixed(1)}천만원`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M원`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K원`;
  return `${v.toLocaleString()}원`;
}

const chartSectionStyle: React.CSSProperties = { marginBottom: '1.5rem' };
const chartTitleStyle: React.CSSProperties = {
  font: 'var(--md-title-small)',
  color: 'var(--md-sys-light-on-surface)',
  marginBottom: '0.75rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
};

function FEBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: 'var(--md-sys-light-surface)', border: '1px solid var(--md-sys-light-outline-variant)', borderRadius: 'var(--md-radius-md)', padding: '8px 12px', font: 'var(--md-body-small)', minWidth: 140 }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--md-sys-light-on-surface)' }}>{payload[0]?.payload?.name}</p>
      <p style={{ margin: 0, color: payload[0]?.fill }}>{fmtAmount(payload[0]?.value)}</p>
    </div>
  );
}

function FEPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ backgroundColor: 'var(--md-sys-light-surface)', border: '1px solid var(--md-sys-light-outline-variant)', borderRadius: 'var(--md-radius-md)', padding: '8px 12px', font: 'var(--md-body-small)' }}>
      <p style={{ margin: 0, color: 'var(--md-sys-light-on-surface)', fontWeight: 700 }}>{p.name}</p>
      <p style={{ margin: '2px 0 0', color: p.payload.fill }}>{fmtAmount(p.value)} ({p.payload.percent != null ? (p.payload.percent * 100).toFixed(1) : '?'}%)</p>
    </div>
  );
}

const GROUP_COLORS = ['#6750A4', '#3D9A8B', '#E07A5F', '#B5838D', '#F4A261', '#81B29A', '#F2CC8F', '#264653'];

function groupKey(category: string): string {
  const idx = category.indexOf('(');
  return idx > 0 ? category.slice(0, idx).trim() : category.trim() || '미분류';
}

interface Props {
  fixedExpenses: FixedExpense[];
  year: number;
  month: number | null;
  onEdit: (item: FixedExpense) => void;
  onDelete: (item: FixedExpense) => void;
}

export default function FixedExpenseDetailView({ fixedExpenses, year, month, onEdit, onDelete }: Props) {
  const monthKey = month !== null ? `${year}-${String(month).padStart(2, '0')}` : null;

  const getAmount = (fe: FixedExpense): number => {
    if (monthKey) {
      return fe.monthly_data?.[monthKey] ?? fe.monthly_amount ?? 0;
    }
    if (fe.monthly_data && Object.keys(fe.monthly_data).length > 0) {
      return Object.values(fe.monthly_data).reduce((s, v) => s + (v || 0), 0);
    }
    return (fe.monthly_amount ?? 0) * 12;
  };

  const getMonthCount = (fe: FixedExpense): number =>
    fe.monthly_data ? Object.keys(fe.monthly_data).length : 0;

  // 성향별 그룹화
  const groupMap = new Map<string, { fe: FixedExpense; amount: number; sub?: string }[]>();
  for (const fe of fixedExpenses) {
    const key = groupKey(fe.category);
    const amount = getAmount(fe);
    if (amount <= 0) continue;
    const cnt = !monthKey ? getMonthCount(fe) : 0;
    const sub = !monthKey && cnt > 0 ? `월평균 ${Math.round(amount / cnt).toLocaleString()}원 · ${cnt}개월` : undefined;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push({ fe, amount, sub });
  }

  const groups = Array.from(groupMap.entries())
    .map(([name, items], idx) => ({
      name,
      items: items.sort((a, b) => b.amount - a.amount),
      total: items.reduce((s, x) => s + x.amount, 0),
      color: GROUP_COLORS[idx % GROUP_COLORS.length],
    }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = groups.reduce((s, g) => s + g.total, 0);
  const monthCount = (() => {
    const months = new Set<string>();
    fixedExpenses.forEach((fe) => Object.keys(fe.monthly_data ?? {}).forEach((k) => months.add(k)));
    return months.size || 1;
  })();
  const totalItems = fixedExpenses.filter((fe) => getAmount(fe) > 0).length;

  // ── 차트 데이터 (연간 뷰에서만) ──────────────────────────────
  const pieCategoryData = useMemo(() => {
    if (monthKey) return [];
    return groups.map((g) => ({ name: g.name, value: g.total, fill: g.color })).filter((d) => d.value > 0);
  }, [groups, monthKey]);

  const barItemData = useMemo(() => {
    if (monthKey) return [];
    const allItems: { name: string; value: number; fill: string }[] = [];
    groups.forEach((g) => {
      g.items.forEach(({ fe, amount }) => {
        allItems.push({ name: fe.item_name, value: amount, fill: g.color });
      });
    });
    return allItems
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [groups, monthKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-lg)' }}>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--md-space-sm)' }}>
        <SummaryCard
          label={monthKey ? '이달 고정비' : '연간 고정비'}
          value={formatCurrency(grandTotal)}
          sub={monthKey ? undefined : `월평균 ${formatCurrency(Math.round(grandTotal / monthCount))}`}
          color="#6750A4"
          bg="rgba(103,80,164,0.08)"
          border="rgba(103,80,164,0.3)"
        />
        <SummaryCard
          label="항목 수"
          value={`${totalItems}개`}
          sub={`${groups.length}개 성향`}
          color="var(--md-sys-light-on-surface)"
          bg="var(--md-sys-light-surface-container-low)"
          border="var(--md-sys-light-outline-variant)"
        />
        <SummaryCard
          label={monthKey ? '월평균 대비' : '최대 성향'}
          value={groups[0]?.name ?? '-'}
          sub={groups[0] ? formatCurrency(groups[0].total) : undefined}
          color={groups[0]?.color ?? 'var(--md-sys-light-on-surface)'}
          bg="var(--md-sys-light-surface-container-low)"
          border="var(--md-sys-light-outline-variant)"
        />
      </div>

      {/* 성향별 전체 비율 막대 */}
      {grandTotal > 0 && groups.length > 1 && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--md-radius-md)', background: 'var(--md-sys-light-surface-container-low)', border: '1px solid var(--md-sys-light-outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)', fontWeight: 600 }}>성향별 비율</span>
            <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>합계 {formatCurrency(grandTotal)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
            {groups.map((g) => (
              <div
                key={g.name}
                title={`${g.name}: ${formatCurrency(g.total)} (${((g.total / grandTotal) * 100).toFixed(1)}%)`}
                style={{ height: '100%', width: `${(g.total / grandTotal) * 100}%`, background: g.color, transition: 'width 0.5s ease' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8 }}>
            {groups.map((g) => (
              <span key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, display: 'inline-block', flexShrink: 0 }} />
                {g.name} {((g.total / grandTotal) * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 성향별 섹션 */}
      {groups.map((group) => (
        <div key={group.name}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: group.color }} />
            <h4 style={{ font: 'var(--md-label-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>{group.name}</h4>
            <span style={{ font: 'var(--md-label-small)', color: group.color, marginLeft: 'auto' }}>
              {formatCurrency(group.total)} · {((group.total / grandTotal) * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            {group.items.map(({ fe, amount, sub }) => {
              const ratio = group.total > 0 ? (amount / group.total) * 100 : 0;
              return (
                <div key={fe.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 0', borderBottom: '1px solid var(--md-sys-light-outline-variant)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fe.item_name}
                      </span>
                      {sub && (
                        <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{sub}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', minWidth: 40, textAlign: 'right' }}>
                        {ratio.toFixed(1)}%
                      </span>
                      <span style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface)', minWidth: 90, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(amount)}
                      </span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button aria-label={`${fe.item_name} 편집`} onClick={() => onEdit(fe)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--md-sys-light-outline-variant)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>편집</button>
                        <button aria-label={`${fe.item_name} 삭제`} onClick={() => onDelete(fe)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(186,26,26,0.4)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-small)', color: 'rgba(186,26,26,0.9)' }}>삭제</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--md-sys-light-surface-container-high)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ratio}%`, background: group.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {groups.length === 0 && (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>
          데이터가 없습니다.
        </p>
      )}

      {/* ── 차트 섹션 (연간 뷰에서만) ── */}
      {!monthKey && (pieCategoryData.length > 0 || barItemData.length > 0) && (
        <div style={{ marginTop: 'var(--md-space-md)' }}>

          {/* 성향별 PieChart */}
          {pieCategoryData.length > 0 && (
            <div style={chartSectionStyle}>
              <h3 style={chartTitleStyle}>성향별 비중</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieCategoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieCategoryData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<FEPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 항목별 수평 BarChart (상위 10개) */}
          {barItemData.length > 0 && (
            <div style={chartSectionStyle}>
              <h3 style={chartTitleStyle}>항목별 금액 (상위 {barItemData.length}개)</h3>
              <ResponsiveContainer width="100%" height={Math.max(250, barItemData.length * 28)}>
                <BarChart
                  data={barItemData}
                  layout="vertical"
                  margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + '…' : v}
                  />
                  <Tooltip content={<FEBarTooltip />} />
                  <Bar dataKey="value" name="금액" radius={[0, 4, 4, 0]}>
                    {barItemData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
