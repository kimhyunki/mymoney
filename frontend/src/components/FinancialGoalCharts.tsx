import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from 'recharts';
import type { FinancialGoal } from '@/types';

interface FinancialGoalChartsProps {
  goals: FinancialGoal[];
}

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

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  font: 'var(--md-body-medium)',
  color: 'var(--md-sys-light-on-surface)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 'var(--md-space-sm) var(--md-space-md)',
  font: 'var(--md-label-large)',
  color: 'var(--md-sys-light-on-surface-variant)',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: 'var(--md-space-sm) var(--md-space-md)',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
};

interface GoalSectionProps {
  goal: FinancialGoal;
}

function ProgressGauge({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.max(0, rate * 100));
  const color = pct >= 80 ? '#3D9A8B' : pct >= 40 ? '#F2CC8F' : '#E07A5F';
  return (
    <div style={{ marginBottom: 'var(--md-space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>진행률</span>
        <span style={{ font: 'var(--md-label-large)', color, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{
        height: 12,
        backgroundColor: 'var(--md-sys-light-surface-container-high)',
        borderRadius: 'var(--md-radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: 'var(--md-radius-full)',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function GoalSection({ goal }: GoalSectionProps) {
  const plannedChartData = useMemo(() => {
    if (!goal.planned_data) return [];
    const byLabel: Record<string, { planned: number; actual: number }> = {};
    for (const item of goal.planned_data) {
      const key = item.date ?? item.item;
      if (!byLabel[key]) byLabel[key] = { planned: 0, actual: 0 };
      byLabel[key].planned += item.amount;
    }
    if (goal.actual_data) {
      for (const item of goal.actual_data) {
        const key = item.date ?? item.item;
        if (!byLabel[key]) byLabel[key] = { planned: 0, actual: 0 };
        byLabel[key].actual += item.amount;
      }
    }
    return Object.entries(byLabel).slice(0, 20).map(([label, vals]) => ({ label, ...vals }));
  }, [goal.planned_data, goal.actual_data]);

  const balanceData = useMemo(() => {
    if (!goal.planned_data) return [];
    return goal.planned_data
      .filter(d => d.balance != null)
      .slice(0, 30)
      .map((d, i) => ({
        label: d.date ?? String(i + 1),
        planned_balance: d.balance ?? 0,
      }));
  }, [goal.planned_data]);

  const actualBalanceData = useMemo(() => {
    if (!goal.actual_data) return [];
    return goal.actual_data
      .filter(d => d.balance != null)
      .slice(0, 30)
      .map((d, i) => ({
        label: d.date ?? String(i + 1),
        actual_balance: d.balance ?? 0,
      }));
  }, [goal.actual_data]);

  // 잔액 라인 데이터 합치기 (label 기준)
  const combinedBalance = useMemo(() => {
    const map: Record<string, { label: string; planned_balance?: number; actual_balance?: number }> = {};
    for (const d of balanceData) {
      map[d.label] = { label: d.label, planned_balance: d.planned_balance };
    }
    for (const d of actualBalanceData) {
      if (map[d.label]) {
        map[d.label].actual_balance = d.actual_balance;
      } else {
        map[d.label] = { label: d.label, actual_balance: d.actual_balance };
      }
    }
    return Object.values(map);
  }, [balanceData, actualBalanceData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        backgroundColor: 'var(--md-sys-light-surface)',
        border: '1px solid var(--md-sys-light-outline-variant)',
        borderRadius: 'var(--md-radius-md)',
        padding: 'var(--md-space-sm) var(--md-space-md)',
        font: 'var(--md-body-medium)',
        minWidth: 160,
      }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ margin: '2px 0', color: p.color }}>
            {p.name}: {p.value != null ? formatAmount(p.value) : '-'}
          </p>
        ))}
      </div>
    );
  };

  const progressPct = (goal.progress_rate ?? 0) * 100;

  return (
    <div style={{
      backgroundColor: 'var(--md-sys-light-surface)',
      borderRadius: 'var(--md-radius-md)',
      border: '1px solid var(--md-sys-light-outline-variant)',
      padding: 'var(--md-space-lg)',
      marginBottom: 'var(--md-space-lg)',
    }}>
      <h3 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
        {goal.goal_name}
      </h3>

      {/* 진행률 게이지 */}
      <ProgressGauge rate={goal.progress_rate ?? 0} />

      {/* 메타 카드 */}
      <div style={{ display: 'flex', gap: 'var(--md-space-sm)', flexWrap: 'wrap', marginBottom: 'var(--md-space-lg)' }}>
        {[
          { label: '목표금액', value: goal.target_amount != null ? formatAmount(goal.target_amount) : '-' },
          { label: '시작일', value: goal.start_date ?? '-' },
          { label: '종료일', value: goal.end_date ?? '-' },
          { label: '전체 주수', value: goal.total_weeks != null ? `${goal.total_weeks}주` : '-' },
          { label: '경과 주수', value: goal.elapsed_weeks != null ? `${goal.elapsed_weeks}주` : '-' },
          { label: '잔여 주수', value: goal.remaining_weeks != null ? `${goal.remaining_weeks}주` : '-' },
          { label: '주별 배정액', value: goal.weekly_allocation != null ? formatAmount(goal.weekly_allocation) : '-' },
          { label: '이자율', value: goal.interest_rate != null ? `${(goal.interest_rate * 100).toFixed(2)}%` : '-' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: '1 1 110px',
            backgroundColor: 'var(--md-sys-light-surface-container)',
            borderRadius: 'var(--md-radius-sm)',
            padding: 'var(--md-space-sm) var(--md-space-md)',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{label}</p>
            <p style={{ margin: '2px 0 0', font: 'var(--md-label-large)', color: 'var(--md-sys-light-on-surface)', fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* 계획 vs 집행 바 차트 */}
      {plannedChartData.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>계획 vs 집행 금액</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={plannedChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="planned" name="계획" fill="#6750A4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="집행" fill="#3D9A8B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 잔액 추이 라인 차트 */}
      {combinedBalance.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>잔액 추이</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={combinedBalance} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="planned_balance" name="계획 잔액" stroke="#6750A4" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="actual_balance" name="집행 잔액" stroke="#3D9A8B" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 계획 테이블 */}
      {goal.planned_data && goal.planned_data.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>계획 내역 (최근 {Math.min(goal.planned_data.length, 20)}건)</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['날짜', '구분', '항목', '금액', '잔액'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goal.planned_data.slice(0, 20).map((item, i) => (
                  <tr key={i}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={tdStyle}>{item.date ?? '-'}</td>
                    <td style={tdStyle}>{item.category ?? '-'}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{item.item}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(item.amount)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: (item.balance ?? 0) < 0 ? '#E07A5F' : 'inherit' }}>
                      {item.balance != null ? formatAmount(item.balance) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 집행 테이블 */}
      {goal.actual_data && goal.actual_data.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>집행 내역 (최근 {Math.min(goal.actual_data.length, 20)}건)</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['날짜', '구분', '항목', '금액', '잔액'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goal.actual_data.slice(0, 20).map((item, i) => (
                  <tr key={i}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={tdStyle}>{item.date ?? '-'}</td>
                    <td style={tdStyle}>{item.category ?? '-'}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{item.item}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(item.amount)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: (item.balance ?? 0) < 0 ? '#E07A5F' : 'inherit' }}>
                      {item.balance != null ? formatAmount(item.balance) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 진행률 시각화 */}
      <div style={{ textAlign: 'center', padding: 'var(--md-space-md) 0' }}>
        <span style={{ font: 'var(--md-body-large)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          진행률 {progressPct.toFixed(1)}% · 목표까지{' '}
          {goal.target_amount != null && goal.planned_data
            ? formatAmount(goal.target_amount - goal.planned_data.reduce((s, d) => s + d.amount, 0))
            : '-'} 남음
        </span>
      </div>
    </div>
  );
}

function FinancialGoalCharts({ goals }: FinancialGoalChartsProps) {
  return (
    <div>
      {goals.map(goal => (
        <GoalSection key={goal.id} goal={goal} />
      ))}
    </div>
  );
}

export default FinancialGoalCharts;
