import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CashFlow } from '@/types';

interface CashFlowChartsProps {
  cashFlows: CashFlow[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0',
];

export default function CashFlowCharts({ cashFlows }: CashFlowChartsProps) {
  const incomeItems = useMemo(() => cashFlows.filter((i) => i.item_type === '수입'), [cashFlows]);
  const expenseItems = useMemo(() => cashFlows.filter((i) => i.item_type === '지출'), [cashFlows]);

  const allMonths = useMemo(() => {
    const months = new Set<string>();
    cashFlows.forEach((item) => {
      if (item.monthly_data) Object.keys(item.monthly_data).forEach((m) => months.add(m));
    });
    return Array.from(months).sort();
  }, [cashFlows]);

  const monthlySummary = useMemo(() =>
    allMonths.map((month) => ({
      month,
      수입: incomeItems.reduce((s, i) => s + (i.monthly_data?.[month] || 0), 0),
      지출: expenseItems.reduce((s, i) => s + (i.monthly_data?.[month] || 0), 0),
      순수입: incomeItems.reduce((s, i) => s + (i.monthly_data?.[month] || 0), 0)
             - expenseItems.reduce((s, i) => s + (i.monthly_data?.[month] || 0), 0),
    })),
    [allMonths, incomeItems, expenseItems]
  );

  const itemTotal = (item: CashFlow): number => {
    if (item.total && item.total > 0) return item.total;
    if (item.monthly_data) return Object.values(item.monthly_data as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
    return 0;
  };

  const incomeByItem = useMemo(() =>
    incomeItems
      .map((i) => ({ name: i.item_name, 총계: itemTotal(i) }))
      .filter((i) => i.총계 > 0)
      .sort((a, b) => b.총계 - a.총계),
    [incomeItems]
  );

  const expenseByItem = useMemo(() =>
    expenseItems
      .map((i) => ({ name: i.item_name, 총계: itemTotal(i) }))
      .filter((i) => i.총계 > 0)
      .sort((a, b) => b.총계 - a.총계),
    [expenseItems]
  );

  const formatAmount = (v: number) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(v);

  const formatYAxis = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map((e: any, i: number) => (
          <p key={i} style={{ color: e.color, margin: '2px 0', fontSize: '0.85em' }}>
            {e.name}: {formatAmount(e.value)}
          </p>
        ))}
      </div>
    );
  };

  if (cashFlows.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--md-sys-light-on-surface-variant)' }}>데이터가 없습니다.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {monthlySummary.length > 0 && (
        <div>
          <h3 style={{ font: 'var(--md-title-small)', marginBottom: '0.75rem' }}>월별 수입/지출 추이</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlySummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="수입" stroke="#00C49F" strokeWidth={2} />
              <Line type="monotone" dataKey="지출" stroke="#FF8042" strokeWidth={2} />
              <Line type="monotone" dataKey="순수입" stroke="#8884d8" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthlySummary.length > 0 && (
        <div>
          <h3 style={{ font: 'var(--md-title-small)', marginBottom: '0.75rem' }}>월별 수입/지출 합계</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlySummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="수입" fill="#00C49F" />
              <Bar dataKey="지출" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {incomeByItem.length > 0 && (
        <div>
          <h3 style={{ font: 'var(--md-title-small)', marginBottom: '0.75rem' }}>수입 항목별 비중</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={incomeByItem} cx="50%" cy="50%" outerRadius={110} dataKey="총계"
                labelLine={false} label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}>
                {incomeByItem.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {expenseByItem.length > 0 && (
        <div>
          <h3 style={{ font: 'var(--md-title-small)', marginBottom: '0.75rem' }}>지출 항목별 비중</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={expenseByItem} cx="50%" cy="50%" outerRadius={110} dataKey="총계"
                labelLine={false} label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}>
                {expenseByItem.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {incomeByItem.length > 0 && (
        <div>
          <h3 style={{ font: 'var(--md-title-small)', marginBottom: '0.75rem' }}>수입 항목별 총계</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incomeByItem}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={90} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="총계" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {expenseByItem.length > 0 && (
        <div>
          <h3 style={{ font: 'var(--md-title-small)', marginBottom: '0.75rem' }}>지출 항목별 총계</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={expenseByItem}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={90} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="총계" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {incomeItems.length > 0 && allMonths.length > 0 && (
        <div>
          <h3 style={{ font: 'var(--md-title-small)', marginBottom: '0.75rem' }}>수입 항목별 월별 비교</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={allMonths.map((month) => {
              const r: any = { month };
              incomeItems.forEach((i) => { r[i.item_name] = i.monthly_data?.[month] || 0; });
              return r;
            })}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {incomeItems.map((item, i) => (
                <Bar key={item.id} dataKey={item.item_name} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {expenseItems.length > 0 && allMonths.length > 0 && (
        <div>
          <h3 style={{ font: 'var(--md-title-small)', marginBottom: '0.75rem' }}>지출 항목별 월별 비교</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={allMonths.map((month) => {
              const r: any = { month };
              expenseItems.forEach((i) => { r[i.item_name] = i.monthly_data?.[month] || 0; });
              return r;
            })}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {expenseItems.map((item, i) => (
                <Bar key={item.id} dataKey={item.item_name} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
