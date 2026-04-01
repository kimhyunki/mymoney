import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { CashFlow } from '@/types';
import { SummaryCard, RatioBar, ItemSection } from './MonthDetailView';
import { formatCurrency } from '@/utils/format';

// ── 차트 유틸 ─────────────────────────────────────────────────
const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const PIE_COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#A28BE2', '#82B4CA', '#F4845F', '#B5838D'];

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

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: 'var(--md-sys-light-surface)', border: '1px solid var(--md-sys-light-outline-variant)', borderRadius: 'var(--md-radius-md)', padding: '8px 12px', font: 'var(--md-body-small)', minWidth: 160 }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--md-sys-light-on-surface)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: '2px 0', color: p.fill }}>{p.name}: {fmtAmount(p.value)}</p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ backgroundColor: 'var(--md-sys-light-surface)', border: '1px solid var(--md-sys-light-outline-variant)', borderRadius: 'var(--md-radius-md)', padding: '8px 12px', font: 'var(--md-body-small)' }}>
      <p style={{ margin: 0, color: 'var(--md-sys-light-on-surface)', fontWeight: 700 }}>{p.name}</p>
      <p style={{ margin: '2px 0 0', color: p.payload.fill }}>{fmtAmount(p.value)} ({p.payload.percent != null ? (p.payload.percent * 100).toFixed(1) : '?'}%)</p>
    </div>
  );
}

function buildPieData(items: { name: string; value: number }[], topN = 7) {
  const sorted = [...items].filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= topN) return sorted;
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN).reduce((s, x) => s + x.value, 0);
  return [...top, { name: '기타', value: rest }];
}

interface YearDetailViewProps {
  cashFlows: CashFlow[];
  year: number;
  onEdit: (item: CashFlow) => void;
  onDelete: (id: number) => void;
}

export default function YearDetailView({ cashFlows, year, onEdit, onDelete }: YearDetailViewProps) {
  const getAmount = (cf: CashFlow) =>
    Object.values(cf.monthly_data ?? {}).reduce((s, v) => s + (v || 0), 0);

  const getMonthCount = (cf: CashFlow) =>
    Object.keys(cf.monthly_data ?? {}).length;

  const incomeItems = useMemo(() => cashFlows
    .filter((c) => c.item_type === '수입')
    .map((c) => {
      const amount = getAmount(c);
      const months = getMonthCount(c);
      return {
        cf: c,
        amount,
        sub: months > 0 ? `월평균 ${Math.round(amount / months).toLocaleString()}원 · ${months}개월` : undefined,
      };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount), [cashFlows]);

  const expenseItems = useMemo(() => cashFlows
    .filter((c) => c.item_type === '지출')
    .map((c) => {
      const amount = getAmount(c);
      const months = getMonthCount(c);
      return {
        cf: c,
        amount,
        sub: months > 0 ? `월평균 ${Math.round(amount / months).toLocaleString()}원 · ${months}개월` : undefined,
      };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount), [cashFlows]);

  const incomeMonthCount = useMemo(
    () => new Set(incomeItems.flatMap(({ cf }) => Object.keys(cf.monthly_data ?? {}))).size || 1,
    [incomeItems]
  );
  const expenseMonthCount = useMemo(
    () => new Set(expenseItems.flatMap(({ cf }) => Object.keys(cf.monthly_data ?? {}))).size || 1,
    [expenseItems]
  );

  const incomeTotal = incomeItems.reduce((s, c) => s + c.amount, 0);
  const expenseTotal = expenseItems.reduce((s, c) => s + c.amount, 0);
  const netIncome = incomeTotal - expenseTotal;
  const total = incomeTotal + expenseTotal;
  const incomeBarRatio = total > 0 ? (incomeTotal / total) * 100 : 50;

  // ── 차트 데이터 ──────────────────────────────────────────────
  // 월별 수입/지출 집계 (1~12월)
  const monthlyBarData = useMemo(() => {
    const byMonth: Record<number, { income: number; expense: number }> = {};
    for (let m = 1; m <= 12; m++) byMonth[m] = { income: 0, expense: 0 };
    cashFlows.forEach((cf) => {
      const type = cf.item_type;
      Object.entries(cf.monthly_data ?? {}).forEach(([k, v]) => {
        const m = parseInt(k.slice(5, 7));
        if (m >= 1 && m <= 12 && (v ?? 0) > 0) {
          if (type === '수입') byMonth[m].income += v ?? 0;
          else if (type === '지출') byMonth[m].expense += v ?? 0;
        }
      });
    });
    return Object.entries(byMonth)
      .map(([m, d]) => ({ month: MONTH_LABELS[Number(m) - 1], ...d }))
      .filter((d) => d.income > 0 || d.expense > 0);
  }, [cashFlows]);

  // 수입/지출 PieChart 데이터 (상위 7 + 기타)
  const incomePieData = useMemo(
    () => buildPieData(incomeItems.map(({ cf, amount }) => ({ name: cf.item_name, value: amount }))),
    [incomeItems]
  );
  const expensePieData = useMemo(
    () => buildPieData(expenseItems.map(({ cf, amount }) => ({ name: cf.item_name, value: amount }))),
    [expenseItems]
  );

  const showCharts = monthlyBarData.length > 0 || incomePieData.length > 0 || expensePieData.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--md-space-sm)' }}>
        <SummaryCard
          label="연간 수입"
          value={formatCurrency(incomeTotal)}
          sub={incomeTotal > 0 ? `월평균 ${Math.round(incomeTotal / incomeMonthCount).toLocaleString()}원` : `${incomeItems.length}개 항목`}
          color="#00C49F"
          bg="rgba(0,196,159,0.08)"
          border="rgba(0,196,159,0.3)"
        />
        <SummaryCard
          label="연간 지출"
          value={formatCurrency(expenseTotal)}
          sub={expenseTotal > 0 ? `월평균 ${Math.round(expenseTotal / expenseMonthCount).toLocaleString()}원` : `${expenseItems.length}개 항목`}
          color="#FF8042"
          bg="rgba(255,128,66,0.08)"
          border="rgba(255,128,66,0.3)"
        />
        <SummaryCard
          label="연간 순수입"
          value={(netIncome >= 0 ? '+' : '-') + formatCurrency(netIncome)}
          sub={netIncome >= 0 ? '흑자' : '적자'}
          color={netIncome >= 0 ? '#8884d8' : 'rgba(186,26,26,0.9)'}
          bg={netIncome >= 0 ? 'rgba(136,132,216,0.08)' : 'rgba(186,26,26,0.05)'}
          border={netIncome >= 0 ? 'rgba(136,132,216,0.3)' : 'rgba(186,26,26,0.25)'}
        />
      </div>

      {total > 0 && <RatioBar incomeRatio={incomeBarRatio} />}

      {incomeItems.length > 0 && (
        <ItemSection title="수입 항목" items={incomeItems} total={incomeTotal} barColor="#00C49F" onEdit={onEdit} onDelete={onDelete} />
      )}
      {expenseItems.length > 0 && (
        <ItemSection title="지출 항목" items={expenseItems} total={expenseTotal} barColor="#FF8042" onEdit={onEdit} onDelete={onDelete} />
      )}
      {incomeItems.length === 0 && expenseItems.length === 0 && (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>
          {year}년 데이터가 없습니다.
        </p>
      )}

      {/* ── 차트 섹션 ── */}
      {showCharts && (
        <div style={{ marginTop: 'var(--md-space-md)' }}>

          {/* 월별 수입/지출 BarChart */}
          {monthlyBarData.length > 0 && (
            <div style={chartSectionStyle}>
              <h3 style={chartTitleStyle}>월별 수입 / 지출</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyBarData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <Bar dataKey="income" name="수입" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="지출" fill="#FF8042" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 수입/지출 PieChart (2열 그리드) */}
          {(incomePieData.length > 0 || expensePieData.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-space-lg)' }}>
              {incomePieData.length > 0 && (
                <div style={chartSectionStyle}>
                  <h3 style={chartTitleStyle}>수입 항목별 비중</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {incomePieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {expensePieData.length > 0 && (
                <div style={chartSectionStyle}>
                  <h3 style={chartTitleStyle}>지출 항목별 비중</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expensePieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
