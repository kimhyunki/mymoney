import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { RealEstateAnalysis } from '@/types';

interface RealEstateChartsProps {
  analyses: RealEstateAnalysis[];
}

const COLORS = ['#6750A4', '#3D9A8B', '#E07A5F', '#F2CC8F', '#B5838D'];

function formatAmount(value: number): string {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(2)}억원`;
  if (Math.abs(value) >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}천만원`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M원`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K원`;
  return `${value.toFixed(0)}원`;
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
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

interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}

function MetricCard({ label, value, color, sub }: MetricCardProps) {
  return (
    <div style={{
      flex: '1 1 130px',
      backgroundColor: 'var(--md-sys-light-surface)',
      borderRadius: 'var(--md-radius-md)',
      padding: 'var(--md-space-md)',
      border: '1px solid var(--md-sys-light-outline-variant)',
      textAlign: 'center',
    }}>
      <p style={{ margin: 0, font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{label}</p>
      <p style={{ margin: '4px 0 0', font: 'var(--md-title-small)', color: color ?? 'var(--md-sys-light-on-surface)', fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ margin: '2px 0 0', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{sub}</p>}
    </div>
  );
}

interface PropertyCardProps {
  analysis: RealEstateAnalysis;
}

function PropertyCard({ analysis }: PropertyCardProps) {
  const assetPieData = useMemo(() => {
    const items = [
      { name: '자기자본', value: analysis.self_capital ?? 0 },
      { name: '타인자본(대출)', value: analysis.loan_capital ?? 0 },
    ].filter(d => d.value > 0);
    return items;
  }, [analysis]);

  const unrealizedGainColor = (analysis.unrealized_gain ?? 0) >= 0 ? '#3D9A8B' : '#E07A5F';
  const roeColor = (analysis.roe ?? 0) >= 0 ? '#3D9A8B' : '#E07A5F';

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
        <p style={{ margin: 0 }}>{formatAmount(value)}</p>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'var(--md-sys-light-surface)',
      borderRadius: 'var(--md-radius-md)',
      border: '1px solid var(--md-sys-light-outline-variant)',
      padding: 'var(--md-space-lg)',
      marginBottom: 'var(--md-space-lg)',
    }}>
      <h3 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-lg)' }}>
        {analysis.property_name ?? '부동산 #' + analysis.id}
      </h3>

      {/* 핵심 지표 카드 */}
      <div style={{ display: 'flex', gap: 'var(--md-space-md)', flexWrap: 'wrap', marginBottom: 'var(--md-space-xl)' }}>
        <MetricCard
          label="총 취득원가"
          value={analysis.total_acquisition_cost != null ? formatAmount(analysis.total_acquisition_cost) : '-'}
        />
        <MetricCard
          label="현재 시세"
          value={analysis.current_market_value != null ? formatAmount(analysis.current_market_value) : '-'}
        />
        <MetricCard
          label="미실현 시세차익"
          value={analysis.unrealized_gain != null ? formatAmount(analysis.unrealized_gain) : '-'}
          color={analysis.unrealized_gain != null ? unrealizedGainColor : undefined}
        />
        <MetricCard
          label="ROE"
          value={analysis.roe != null ? formatRate(analysis.roe) : '-'}
          color={analysis.roe != null ? roeColor : undefined}
          sub="자기자본 수익률"
        />
        <MetricCard
          label="레버리지 배수"
          value={analysis.leverage_multiple != null ? `${analysis.leverage_multiple.toFixed(2)}x` : '-'}
          sub="총자산/자기자본"
        />
        <MetricCard
          label="가속계수"
          value={analysis.acceleration_factor != null ? `${analysis.acceleration_factor.toFixed(2)}x` : '-'}
          sub="ROE 증폭 효과"
        />
      </div>

      {/* 자기자본 vs 타인자본 파이 차트 */}
      {assetPieData.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>자본 구조 (자기자본 vs 타인자본)</h4>
          <div style={{ display: 'flex', gap: 'var(--md-space-xl)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 280px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={assetPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {assetPieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 자본 구조 상세 */}
            <div style={{ flex: '1 1 200px' }}>
              {[
                { label: '자기자본', value: analysis.self_capital, color: COLORS[0] },
                { label: '타인자본(대출)', value: analysis.loan_capital, color: COLORS[1] },
                { label: '총 취득원가', value: analysis.total_acquisition_cost, color: 'var(--md-sys-light-on-surface)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--md-space-sm) 0',
                  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
                }}>
                  <span style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>{label}</span>
                  <span style={{ font: 'var(--md-label-large)', color, fontWeight: 700 }}>
                    {value != null ? formatAmount(value) : '-'}
                  </span>
                </div>
              ))}
              {analysis.total_acquisition_cost != null && analysis.self_capital != null && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--md-space-sm) 0',
                }}>
                  <span style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>레버리지 비율</span>
                  <span style={{ font: 'var(--md-label-large)', color: '#6750A4', fontWeight: 700 }}>
                    {(analysis.total_acquisition_cost / analysis.self_capital).toFixed(2)}x
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROE 분석 섹션 */}
      {(analysis.roe != null || analysis.leverage_multiple != null) && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>수익성 분석</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--md-space-md)',
          }}>
            {analysis.roe != null && (
              <div style={{
                backgroundColor: roeColor + '15',
                border: `1px solid ${roeColor}40`,
                borderRadius: 'var(--md-radius-md)',
                padding: 'var(--md-space-lg)',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>ROE (자기자본 수익률)</p>
                <p style={{ margin: '8px 0 0', font: 'var(--md-display-small, var(--md-title-large))', color: roeColor, fontWeight: 800, fontSize: 36 }}>
                  {formatRate(analysis.roe)}
                </p>
                <p style={{ margin: '4px 0 0', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                  시세차익 / 자기자본
                </p>
              </div>
            )}
            {analysis.leverage_multiple != null && (
              <div style={{
                backgroundColor: '#6750A415',
                border: '1px solid #6750A440',
                borderRadius: 'var(--md-radius-md)',
                padding: 'var(--md-space-lg)',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>레버리지 배수</p>
                <p style={{ margin: '8px 0 0', font: 'var(--md-title-large)', color: '#6750A4', fontWeight: 800, fontSize: 36 }}>
                  {analysis.leverage_multiple.toFixed(2)}x
                </p>
                <p style={{ margin: '4px 0 0', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                  총 취득원가 / 자기자본
                </p>
              </div>
            )}
            {analysis.acceleration_factor != null && (
              <div style={{
                backgroundColor: '#3D9A8B15',
                border: '1px solid #3D9A8B40',
                borderRadius: 'var(--md-radius-md)',
                padding: 'var(--md-space-lg)',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>가속계수</p>
                <p style={{ margin: '8px 0 0', font: 'var(--md-title-large)', color: '#3D9A8B', fontWeight: 800, fontSize: 36 }}>
                  {analysis.acceleration_factor.toFixed(2)}x
                </p>
                <p style={{ margin: '4px 0 0', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                  ROE 증폭 효과 (레버리지×기준ROE)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RealEstateCharts({ analyses }: RealEstateChartsProps) {
  const totalAcquisition = analyses.reduce((s, a) => s + (a.total_acquisition_cost ?? 0), 0);
  const totalUnrealizedGain = analyses.reduce((s, a) => s + (a.unrealized_gain ?? 0), 0);
  const avgRoe = analyses.length > 0
    ? analyses.filter(a => a.roe != null).reduce((s, a) => s + (a.roe ?? 0), 0) / analyses.filter(a => a.roe != null).length
    : null;

  return (
    <div>
      {/* 전체 요약 카드 (복수 부동산일 경우) */}
      {analyses.length > 1 && (
        <div style={{ display: 'flex', gap: 'var(--md-space-md)', marginBottom: 'var(--md-space-xl)', flexWrap: 'wrap' }}>
          {[
            { label: '부동산 수', value: `${analyses.length}건` },
            { label: '총 취득원가 합계', value: formatAmount(totalAcquisition) },
            { label: '미실현 시세차익 합계', value: formatAmount(totalUnrealizedGain), color: totalUnrealizedGain >= 0 ? '#3D9A8B' : '#E07A5F' },
            { label: '평균 ROE', value: avgRoe != null ? formatRate(avgRoe) : '-', color: avgRoe != null && avgRoe >= 0 ? '#3D9A8B' : '#E07A5F' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: '1 1 130px',
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
        </div>
      )}

      {/* 개별 부동산 카드 */}
      {analyses.map(analysis => (
        <PropertyCard key={analysis.id} analysis={analysis} />
      ))}
    </div>
  );
}

export default RealEstateCharts;
