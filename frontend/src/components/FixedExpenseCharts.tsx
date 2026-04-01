import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { FixedExpense } from '@/types';

interface FixedExpenseChartsProps {
  fixedExpenses: FixedExpense[];
}

const COLORS = ['#6750A4', '#B5838D', '#3D9A8B', '#E07A5F', '#F2CC8F', '#81B29A', '#F4A261', '#264653'];

function groupKey(category: string): string {
  const idx = category.indexOf('(');
  return idx > 0 ? category.slice(0, idx).trim() : category.trim() || '미분류';
}

function formatAmount(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

function formatYAxis(value: number): string {
  return value.toLocaleString('ko-KR');
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 'var(--md-space-xl)',
};

const sectionTitleStyle: React.CSSProperties = {
  font: 'var(--md-title-small)',
  color: 'var(--md-sys-light-on-surface)',
  marginBottom: 'var(--md-space-md)',
  paddingBottom: 'var(--md-space-xs)',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
};


function FixedExpenseCharts({ fixedExpenses }: FixedExpenseChartsProps) {
  // 대분류별 합계 (괄호 앞 접두어 기준)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const fe of fixedExpenses) {
      const key = groupKey(fe.category);
      map[key] = (map[key] ?? 0) + (fe.monthly_amount ?? 0);
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [fixedExpenses]);

  // 항목별 월 금액 (상위 15개)
  const itemData = useMemo(() => {
    return [...fixedExpenses]
      .filter(fe => fe.monthly_amount != null && fe.monthly_amount > 0)
      .sort((a, b) => (b.monthly_amount ?? 0) - (a.monthly_amount ?? 0))
      .slice(0, 15)
      .map(fe => ({ name: fe.item_name, amount: fe.monthly_amount ?? 0, group: groupKey(fe.category) }));
  }, [fixedExpenses]);

  const totalMonthly = useMemo(
    () => fixedExpenses.reduce((sum, fe) => sum + (fe.monthly_amount ?? 0), 0),
    [fixedExpenses]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'var(--md-sys-light-surface)',
        border: '1px solid var(--md-sys-light-outline-variant)',
        borderRadius: 'var(--md-radius-md)',
        padding: 'var(--md-space-sm) var(--md-space-md)',
        font: 'var(--md-body-medium)',
      }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{name}</p>
        <p style={{ margin: 0 }}>{formatAmount(value ?? payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div>
      {/* 요약 카드 */}
      <div style={{ display: 'flex', gap: 'var(--md-space-md)', marginBottom: 'var(--md-space-xl)', flexWrap: 'wrap' }}>
        {[
          { label: '총 항목', value: `${fixedExpenses.length}개` },
          { label: '월 고정비 합계', value: formatAmount(totalMonthly) },
          { label: '성향 수', value: `${categoryData.length}개` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: '1 1 120px',
            backgroundColor: 'var(--md-sys-light-surface)',
            borderRadius: 'var(--md-radius-md)',
            padding: 'var(--md-space-md)',
            border: '1px solid var(--md-sys-light-outline-variant)',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{label}</p>
            <p style={{ margin: '4px 0 0', font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* 성향별 파이 차트 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>성향별 월 고정비</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={true}
            >
              {categoryData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatAmount(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 항목별 바 차트 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>항목별 월 금액 (상위 15개)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={itemData} layout="vertical" margin={{ left: 120, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={formatYAxis} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="#6750A4" radius={[0, 4, 4, 0]}>
              {itemData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[categoryData.findIndex(c => c.name === entry.group) % COLORS.length] ?? '#6750A4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default FixedExpenseCharts;
