import { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, ReferenceLine,
} from 'recharts';
import type { MonthlySummary } from '@/types';

interface MonthlySummaryChartsProps {
  summaries: MonthlySummary[];
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function formatAmount(value: number): string {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억원`;
  if (Math.abs(value) >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}천만원`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M원`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K원`;
  return `${value.toFixed(0)}원`;
}

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`;
  if (Math.abs(value) >= 10_000_000) return `${(value / 10_000_000).toFixed(0)}천만`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
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

function MonthlySummaryCharts({ summaries }: MonthlySummaryChartsProps) {
  // 연도별 그룹핑
  const years = useMemo(() => [...new Set(summaries.map(s => s.year))].sort(), [summaries]);

  // 차트 데이터: 연도 내 1-12월 순서로
  const chartData = useMemo(() => {
    return summaries
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .map(s => ({
        label: `${s.year}-${String(s.month).padStart(2, '0')}`,
        monthLabel: MONTH_LABELS[s.month - 1],
        income: s.income ?? 0,
        expense: s.expense ?? 0,
        net_income: s.net_income ?? 0,
        cumulative_net_income: s.cumulative_net_income ?? 0,
        investment_principal: s.investment_principal ?? null,
        investment_value: s.investment_value ?? null,
      }));
  }, [summaries]);

  // 입력된 데이터가 있는 월만 필터 (income > 0 or expense > 0)
  const activeData = chartData.filter(d => d.income > 0 || d.expense > 0);

  // 투자 데이터 필터 (principal이 있는 것)
  const investData = chartData.filter(d => d.investment_principal != null && d.investment_principal > 0);

  // 요약 통계 (최근 데이터 기준)
  const latest = activeData[activeData.length - 1];
  const totalIncome = activeData.reduce((s, d) => s + d.income, 0);
  const totalExpense = activeData.reduce((s, d) => s + d.expense, 0);

  // 투자 현황: 가장 최근 투자 데이터 기준
  const latestInvest = investData.length > 0 ? investData[investData.length - 1] : null;
  const investReturnRate =
    latestInvest != null &&
    latestInvest.investment_principal != null &&
    latestInvest.investment_principal !== 0 &&
    latestInvest.investment_value != null
      ? ((latestInvest.investment_value - latestInvest.investment_principal) /
          latestInvest.investment_principal) *
        100
      : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        backgroundColor: 'var(--md-sys-light-surface)',
        border: '1px solid var(--md-sys-light-outline-variant)',
        borderRadius: 'var(--md-radius-md)',
        padding: 'var(--md-space-sm) var(--md-space-md)',
        font: 'var(--md-body-medium)',
        minWidth: 180,
      }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--md-sys-light-on-surface)' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ margin: '2px 0', color: p.color }}>
            {p.name}: {p.value != null ? formatAmount(p.value) : '-'}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* 요약 카드 */}
      <div style={{ display: 'flex', gap: 'var(--md-space-md)', marginBottom: 'var(--md-space-xl)', flexWrap: 'wrap' }}>
        {[
          { label: '연도', value: years.join(', '), color: undefined },
          { label: '누적 수입 합계', value: formatAmount(totalIncome), color: undefined },
          { label: '누적 지출 합계', value: formatAmount(totalExpense), color: undefined },
          { label: '누적 순수익', value: latest ? formatAmount(latest.cumulative_net_income) : '-', color: undefined },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: '1 1 140px',
            backgroundColor: 'var(--md-sys-light-surface)',
            borderRadius: 'var(--md-radius-md)',
            padding: 'var(--md-space-md)',
            border: '1px solid var(--md-sys-light-outline-variant)',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{label}</p>
            <p style={{ margin: '4px 0 0', font: 'var(--md-title-small)', color: color ?? 'var(--md-sys-light-on-surface)', fontWeight: 700 }}>{value}</p>
          </div>
        ))}

        {/* 투자 현황 카드 (데이터가 있는 경우에만 표시) */}
        {latestInvest != null && (
          <>
            <div style={{
              flex: '1 1 140px',
              backgroundColor: 'var(--md-sys-light-surface)',
              borderRadius: 'var(--md-radius-md)',
              padding: 'var(--md-space-md)',
              border: '1px solid var(--md-sys-light-outline-variant)',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>투자 원금</p>
              <p style={{ margin: '4px 0 0', font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', fontWeight: 700 }}>
                {latestInvest.investment_principal != null ? formatAmount(latestInvest.investment_principal) : '-'}
              </p>
            </div>
            <div style={{
              flex: '1 1 140px',
              backgroundColor: 'var(--md-sys-light-surface)',
              borderRadius: 'var(--md-radius-md)',
              padding: 'var(--md-space-md)',
              border: '1px solid var(--md-sys-light-outline-variant)',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>투자 평가금</p>
              <p style={{ margin: '4px 0 0', font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', fontWeight: 700 }}>
                {latestInvest.investment_value != null ? formatAmount(latestInvest.investment_value) : '-'}
              </p>
            </div>
            <div style={{
              flex: '1 1 140px',
              backgroundColor: 'var(--md-sys-light-surface)',
              borderRadius: 'var(--md-radius-md)',
              padding: 'var(--md-space-md)',
              border: '1px solid var(--md-sys-light-outline-variant)',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>투자 수익률</p>
              <p style={{
                margin: '4px 0 0',
                font: 'var(--md-title-small)',
                fontWeight: 700,
                color: investReturnRate == null
                  ? 'var(--md-sys-light-on-surface)'
                  : investReturnRate >= 0
                  ? '#3D9A8B'
                  : 'rgba(186,26,26,0.9)',
              }}>
                {investReturnRate != null ? `${investReturnRate >= 0 ? '+' : ''}${investReturnRate.toFixed(2)}%` : '-'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* 월별 수입/지출/순수익 복합 차트 */}
      {activeData.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>월별 수입 / 지출 / 순수익</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={activeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" name="수입" fill="#3D9A8B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="지출" fill="#E07A5F" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="net_income" name="순수익" stroke="#6750A4" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 누적 순수익 라인 차트 */}
      {activeData.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>누적 순수익 추이</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={activeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="cumulative_net_income"
                name="누적 순수익"
                stroke="#6750A4"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 투자 원금 vs 평가금 */}
      {investData.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>투자 원금 vs 평가금</h3>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={investData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="investment_principal" name="투자 원금" fill="#B5838D" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="investment_value" name="평가금" stroke="#3D9A8B" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default MonthlySummaryCharts;
