import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  getInvestmentStatuses,
  createInvestmentStatus,
  updateInvestmentStatus,
  deleteInvestmentStatus,
} from '@/lib/api';
import type { InvestmentStatus, InvestmentStatusCreate, InvestmentStatusUpdate } from '@/types';

type Tab = '목록' | '차트';

// ── 스타일 ────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: 'var(--md-space-lg)',
  boxShadow: 'var(--md-shadow-soft)',
};

const btnPrimary: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-primary)', color: 'var(--md-sys-light-on-primary)',
  border: 'none', borderRadius: 'var(--md-radius-sm)', padding: '6px 14px',
  font: 'var(--md-label-medium)', cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  backgroundColor: 'transparent', color: 'var(--md-sys-light-primary)',
  border: '1px solid var(--md-sys-light-primary)', borderRadius: 'var(--md-radius-sm)',
  padding: '4px 10px', font: 'var(--md-label-small)', cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  backgroundColor: 'transparent', color: 'var(--md-sys-light-error, #ba1a1a)',
  border: '1px solid var(--md-sys-light-error, #ba1a1a)', borderRadius: 'var(--md-radius-sm)',
  padding: '4px 10px', font: 'var(--md-label-small)', cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container-high)',
  border: '1px solid var(--md-sys-light-outline-variant)', borderRadius: 'var(--md-radius-sm)',
  padding: '7px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px',
  font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 10px',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', whiteSpace: 'nowrap',
  backgroundColor: 'var(--md-sys-light-surface)',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px', borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)',
};

const CHART_COLORS = [
  '#4285F4', '#EA4335', '#FBBC05', '#34A853',
  '#FF6D00', '#AA00FF', '#00BCD4', '#8BC34A',
  '#F06292', '#26A69A', '#7E57C2', '#42A5F5',
  '#D4E157', '#EC407A', '#29B6F6',
];

function fmt(n: number | null | undefined): string {
  if (n == null) return '-';
  return n.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
}

function fmtRate(n: number | null | undefined): string {
  if (n == null) return '-';
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// 긴 상품명 줄임 처리
function shortName(name: string, maxLen = 16): string {
  return name.length > maxLen ? name.slice(0, maxLen) + '…' : name;
}

// ── 폼 컴포넌트 ───────────────────────────────────────────────
interface FormData {
  investment_type: string;
  company: string;
  product_name: string;
  principal: string;
  current_value: string;
}

const EMPTY_FORM: FormData = {
  investment_type: '주식', company: '', product_name: '',
  principal: '', current_value: '',
};

function toFormData(item: InvestmentStatus): FormData {
  return {
    investment_type: item.investment_type ?? '',
    company: item.company ?? '',
    product_name: item.product_name,
    principal: item.principal != null ? String(item.principal) : '',
    current_value: item.current_value != null ? String(item.current_value) : '',
  };
}

// 수익률은 투자원금·평가금액으로부터 자동 계산
function calcReturnRate(principal: string, currentValue: string): number | null {
  const p = parseFloat(principal.replace(/,/g, ''));
  const v = parseFloat(currentValue.replace(/,/g, ''));
  if (!isNaN(p) && p !== 0 && !isNaN(v)) return ((v - p) / p) * 100;
  return null;
}

function toPayload(f: FormData): InvestmentStatusCreate {
  const principal = f.principal ? parseFloat(f.principal.replace(/,/g, '')) : null;
  const current_value = f.current_value ? parseFloat(f.current_value.replace(/,/g, '')) : null;
  const return_rate = calcReturnRate(f.principal, f.current_value);
  return {
    investment_type: f.investment_type || null,
    company: f.company || null,
    product_name: f.product_name,
    principal,
    current_value,
    return_rate,
  };
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function InvestmentStatusComponent() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('목록');
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['investment-statuses'],
    queryFn: getInvestmentStatuses,
    refetchInterval: 30000,
  });

  const createMut = useMutation({
    mutationFn: (d: InvestmentStatusCreate) => createInvestmentStatus(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investment-statuses'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: InvestmentStatusUpdate }) => updateInvestmentStatus(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investment-statuses'] }); setEditId(null); },
  });

  const deleteMut = useMutation({
    mutationFn: deleteInvestmentStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investment-statuses'] }),
  });

  // ── 요약 계산 ───────────────────────────────────────────────
  const totalPrincipal = items.reduce((s, i) => s + (i.principal ?? 0), 0);
  const totalValue = items.reduce((s, i) => s + (i.current_value ?? 0), 0);
  const totalPnL = totalValue - totalPrincipal;
  const totalReturnRate = totalPrincipal > 0 ? (totalPnL / totalPrincipal) * 100 : 0;

  // ── 탭 스타일 ────────────────────────────────────────────────
  const tabStyle = (key: Tab): React.CSSProperties => ({
    padding: 'var(--md-space-sm) var(--md-space-md)',
    font: 'var(--md-label-large)',
    border: 'none',
    borderBottom: activeTab === key ? '2px solid var(--md-sys-light-primary)' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === key ? 'var(--md-sys-light-primary)' : 'var(--md-sys-light-on-surface-variant)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
  });

  // ── 차트 데이터 ──────────────────────────────────────────────
  const pieData = items
    .filter(i => (i.current_value ?? 0) > 0)
    .map(i => ({ name: i.product_name, value: i.current_value ?? 0, company: i.company }))
    .sort((a, b) => b.value - a.value);

  const barData = [...items]
    .sort((a, b) => (b.return_rate ?? 0) - (a.return_rate ?? 0))
    .map(i => ({
      name: shortName(i.product_name),
      fullName: i.product_name,
      return_rate: i.return_rate ?? 0,
      pnl: (i.current_value ?? 0) - (i.principal ?? 0),
    }));

  // ── 수익률 색상 ──────────────────────────────────────────────
  function rateColor(rate: number | null) {
    if (rate == null) return 'var(--md-sys-light-on-surface-variant)';
    if (rate > 0) return '#1a7f37';
    if (rate < 0) return '#ba1a1a';
    return 'var(--md-sys-light-on-surface)';
  }

  if (isLoading) {
    return <div style={{ padding: 'var(--md-space-xl)', textAlign: 'center', color: 'var(--md-sys-light-on-surface-variant)' }}>로딩 중...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-lg)' }}>

      {/* ── 요약 카드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--md-space-md)' }}>
        {[
          { label: '총 투자원금', value: `₩${fmt(totalPrincipal)}`, color: undefined },
          { label: '총 평가금액', value: `₩${fmt(totalValue)}`, color: undefined },
          {
            label: '평가손익',
            value: `${totalPnL >= 0 ? '+' : ''}₩${fmt(Math.abs(totalPnL))}`,
            color: rateColor(totalPnL),
          },
          {
            label: '총 수익률',
            value: fmtRate(totalReturnRate),
            color: rateColor(totalReturnRate),
          },
        ].map(card => (
          <div key={card.label} style={{ ...cardStyle, padding: 'var(--md-space-md)' }}>
            <div style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ font: 'var(--md-title-medium)', color: card.color ?? 'var(--md-sys-light-on-surface)', fontWeight: 600 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── 탭 바 + 추가 버튼 ── */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--md-space-md)', borderBottom: '1px solid var(--md-sys-light-outline-variant)' }}>
          <div style={{ display: 'flex' }}>
            <button style={tabStyle('목록')} onClick={() => setActiveTab('목록')}>
              목록 <span style={{ fontSize: '0.8em', opacity: 0.7 }}>({items.length})</span>
            </button>
            <button style={tabStyle('차트')} onClick={() => setActiveTab('차트')}>차트</button>
          </div>
          <button
            style={{ ...btnPrimary, margin: 'var(--md-space-sm) 0' }}
            onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          >
            + 추가
          </button>
        </div>

        <div style={{ padding: 'var(--md-space-lg)' }}>

          {/* ── 추가 폼 ── */}
          {showForm && (
            <div style={{ ...cardStyle, backgroundColor: 'var(--md-sys-light-surface-container-low)', marginBottom: 'var(--md-space-lg)' }}>
              <div style={{ font: 'var(--md-title-small)', marginBottom: 'var(--md-space-md)', color: 'var(--md-sys-light-on-surface)' }}>새 투자 항목</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--md-space-md)', marginBottom: 'var(--md-space-md)' }}>
                {[
                  { key: 'investment_type', label: '종류', placeholder: '주식' },
                  { key: 'company', label: '금융사', placeholder: '미래에셋증권' },
                  { key: 'product_name', label: '상품명 *', placeholder: '애플' },
                  { key: 'principal', label: '투자원금', placeholder: '0' },
                  { key: 'current_value', label: '평가금액', placeholder: '0' },
                ].map(({ key, label, placeholder }) => (
                  <label key={key} style={labelStyle}>
                    {label}
                    <input
                      style={inputStyle}
                      placeholder={placeholder}
                      value={form[key as keyof FormData]}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </label>
                ))}
                <label style={labelStyle}>
                  <span>수익률(%) <span style={{ color: 'var(--md-sys-light-primary)', fontSize: '0.85em' }}>자동계산</span></span>
                  <div style={{ ...inputStyle, backgroundColor: 'var(--md-sys-light-surface-container)', color: 'var(--md-sys-light-primary)', cursor: 'default' }}>
                    {calcReturnRate(form.principal, form.current_value) != null
                      ? `${calcReturnRate(form.principal, form.current_value)!.toFixed(2)}%`
                      : '—'}
                  </div>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 'var(--md-space-sm)' }}>
                <button style={btnPrimary} onClick={() => { if (form.product_name) createMut.mutate(toPayload(form)); }}>저장</button>
                <button style={btnSecondary} onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>취소</button>
              </div>
            </div>
          )}

          {/* ── 목록 탭 ── */}
          {activeTab === '목록' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['종류', '금융사', '상품명', '투자원금', '평가금액', '평가손익', '수익률', ''].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const pnl = (item.current_value ?? 0) - (item.principal ?? 0);
                    if (editId === item.id) {
                      return (
                        <tr key={item.id}>
                          <td colSpan={8} style={{ ...tdStyle, padding: 'var(--md-space-md)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--md-space-sm)', marginBottom: 'var(--md-space-sm)' }}>
                              {[
                                { key: 'investment_type', label: '종류' },
                                { key: 'company', label: '금융사' },
                                { key: 'product_name', label: '상품명' },
                                { key: 'principal', label: '투자원금' },
                                { key: 'current_value', label: '평가금액' },
                              ].map(({ key, label }) => (
                                <label key={key} style={labelStyle}>
                                  {label}
                                  <input
                                    style={inputStyle}
                                    value={form[key as keyof FormData]}
                                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                                  />
                                </label>
                              ))}
                              <label style={labelStyle}>
                                <span>수익률(%) <span style={{ color: 'var(--md-sys-light-primary)', fontSize: '0.85em' }}>자동계산</span></span>
                                <div style={{ ...inputStyle, backgroundColor: 'var(--md-sys-light-surface-container)', color: 'var(--md-sys-light-primary)', cursor: 'default' }}>
                                  {calcReturnRate(form.principal, form.current_value) != null
                                    ? `${calcReturnRate(form.principal, form.current_value)!.toFixed(2)}%`
                                    : '—'}
                                </div>
                              </label>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--md-space-sm)' }}>
                              <button style={btnPrimary} onClick={() => { if (form.product_name) updateMut.mutate({ id: item.id, d: toPayload(form) as InvestmentStatusUpdate }); }}>저장</button>
                              <button style={btnSecondary} onClick={() => setEditId(null)}>취소</button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={item.id} style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-sys-light-on-surface) 4%, transparent)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={tdStyle}>{item.investment_type ?? '-'}</td>
                        <td style={tdStyle}>{item.company ?? '-'}</td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{item.product_name}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>₩{fmt(item.principal)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>₩{fmt(item.current_value)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: rateColor(pnl), fontWeight: 500 }}>
                          {pnl >= 0 ? '+' : ''}₩{fmt(Math.abs(pnl))}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: rateColor(item.return_rate), fontWeight: 600 }}>
                          {fmtRate(item.return_rate)}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button style={btnSecondary} onClick={() => { setEditId(item.id); setForm(toFormData(item)); }}>수정</button>
                            <button style={btnDanger} onClick={() => { if (confirm(`"${item.product_name}" 항목을 삭제할까요?`)) deleteMut.mutate(item.id); }}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--md-space-xl)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                  투자 현황 데이터가 없습니다.
                </div>
              )}
            </div>
          )}

          {/* ── 차트 탭 ── */}
          {activeTab === '차트' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-xl)' }}>

              {/* 파이 차트: 포트폴리오 비중 */}
              <div>
                <div style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
                  포트폴리오 비중 (평가금액 기준)
                </div>
                <div style={{ display: 'flex', gap: 'var(--md-space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
                  <ResponsiveContainer width={300} height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`₩${fmt(value)}`, '평가금액']}
                        labelFormatter={(label) => label}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* 범례 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 200 }}>
                    {pieData.map((d, idx) => {
                      const pct = totalValue > 0 ? (d.value / totalValue * 100).toFixed(1) : '0.0';
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', font: 'var(--md-body-small)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length], flexShrink: 0 }} />
                          <span style={{ flex: 1, color: 'var(--md-sys-light-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                          <span style={{ color: 'var(--md-sys-light-on-surface-variant)', flexShrink: 0 }}>{pct}%</span>
                          <span style={{ color: 'var(--md-sys-light-on-surface)', flexShrink: 0 }}>₩{fmt(d.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 바 차트: 수익률 */}
              <div>
                <div style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
                  종목별 수익률 (%)
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={barData} margin={{ top: 8, right: 16, left: 8, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-light-outline-variant)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'var(--md-sys-light-on-surface-variant)', fontSize: 11 }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: 'var(--md-sys-light-on-surface-variant)', fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: number, _name, props) => [
                        `${value > 0 ? '+' : ''}${value.toFixed(2)}%  (P&L: ${props.payload.pnl >= 0 ? '+' : ''}₩${fmt(props.payload.pnl)})`,
                        props.payload.fullName,
                      ]}
                    />
                    <ReferenceLine y={0} stroke="var(--md-sys-light-outline)" />
                    <Bar dataKey="return_rate" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.return_rate >= 0 ? '#34A853' : '#EA4335'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
