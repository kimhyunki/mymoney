import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRealEstateAnalyses,
  createRealEstateAnalysis,
  updateRealEstateAnalysis,
  deleteRealEstateAnalysis,
} from '@/lib/api';
import type { RealEstateAnalysis, RealEstateAnalysisCreate, RealEstateAnalysisUpdate } from '@/types';
import RealEstateCharts from './RealEstateCharts';

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
  font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)', whiteSpace: 'nowrap',
};

// ── 폼 타입 ───────────────────────────────────────────────────
type FormState = {
  property_name: string; total_acquisition_cost: string; self_capital: string;
  loan_capital: string; current_market_value: string; unrealized_gain: string;
  roe: string; leverage_multiple: string; acceleration_factor: string;
};

const emptyForm = (): FormState => ({
  property_name: '', total_acquisition_cost: '', self_capital: '',
  loan_capital: '', current_market_value: '', unrealized_gain: '',
  roe: '', leverage_multiple: '', acceleration_factor: '',
});

function analysisToForm(a: RealEstateAnalysis): FormState {
  return {
    property_name: a.property_name ?? '',
    total_acquisition_cost: a.total_acquisition_cost != null ? String(a.total_acquisition_cost) : '',
    self_capital: a.self_capital != null ? String(a.self_capital) : '',
    loan_capital: a.loan_capital != null ? String(a.loan_capital) : '',
    current_market_value: a.current_market_value != null ? String(a.current_market_value) : '',
    unrealized_gain: a.unrealized_gain != null ? String(a.unrealized_gain) : '',
    roe: a.roe != null ? String(a.roe) : '',
    leverage_multiple: a.leverage_multiple != null ? String(a.leverage_multiple) : '',
    acceleration_factor: a.acceleration_factor != null ? String(a.acceleration_factor) : '',
  };
}

function parseNum(v: string): number | null {
  const n = parseFloat(v.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function formToPayload(f: FormState): RealEstateAnalysisCreate {
  return {
    property_name: f.property_name || null,
    total_acquisition_cost: parseNum(f.total_acquisition_cost),
    self_capital: parseNum(f.self_capital), loan_capital: parseNum(f.loan_capital),
    current_market_value: parseNum(f.current_market_value), unrealized_gain: parseNum(f.unrealized_gain),
    roe: parseNum(f.roe), leverage_multiple: parseNum(f.leverage_multiple),
    acceleration_factor: parseNum(f.acceleration_factor),
  };
}

// ── Modal ────────────────────────────────────────────────────
function RealEstateModal({ title, form, onChange, onSubmit, onCancel, submitting, submitLabel }: {
  title: string; form: FormState; onChange: (field: keyof FormState, value: string) => void;
  onSubmit: () => void; onCancel: () => void; submitting: boolean; submitLabel: string;
}) {
  const field = (key: keyof FormState, label: string, placeholder = '') => (
    <label style={labelStyle}>
      {label}
      <input type="number" style={inputStyle} value={form[key]} placeholder={placeholder}
        onChange={e => onChange(key, e.target.value)} />
    </label>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ backgroundColor: 'var(--md-sys-light-surface)', borderRadius: 'var(--md-radius-lg)', border: '1px solid var(--md-sys-light-outline-variant)', padding: '28px 32px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--md-shadow-soft)' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ font: 'var(--md-title-medium)', color: 'var(--md-sys-light-on-surface)', marginBottom: '20px' }}>{title}</h3>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>
            부동산명
            <input type="text" style={inputStyle} value={form.property_name} placeholder="예: 래미안 아파트"
              onChange={e => onChange('property_name', e.target.value)} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          {field('total_acquisition_cost', '총 취득원가', '0')}
          {field('self_capital', '자기자본', '0')}
          {field('loan_capital', '대출자본', '0')}
          {field('current_market_value', '현재 시세', '0')}
          {field('unrealized_gain', '미실현 이익', '0')}
          {field('roe', 'ROE (%)', '0')}
          {field('leverage_multiple', '레버리지 배수', '0')}
          {field('acceleration_factor', '가속도 인수', '0')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
          <button style={btnSecondary} onClick={onCancel} disabled={submitting}>취소</button>
          <button style={btnPrimary} onClick={onSubmit} disabled={submitting}>
            {submitting ? '저장 중...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
function RealEstateStatus() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('목록');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<RealEstateAnalysis | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data: analyses = [], isLoading, error } = useQuery({
    queryKey: ['realEstateAnalyses'],
    queryFn: () => getRealEstateAnalyses(),
    refetchInterval: 30000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['realEstateAnalyses'] });

  const createMutation = useMutation({
    mutationFn: (data: RealEstateAnalysisCreate) => createRealEstateAnalysis(data),
    onSuccess: () => { invalidate(); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RealEstateAnalysisUpdate }) => updateRealEstateAnalysis(id, data),
    onSuccess: () => { invalidate(); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRealEstateAnalysis(id),
    onSuccess: () => invalidate(),
  });

  function openCreate() { setForm(emptyForm()); setEditTarget(null); setModalMode('create'); }
  function openEdit(a: RealEstateAnalysis) { setForm(analysisToForm(a)); setEditTarget(a); setModalMode('edit'); }
  function closeModal() { setModalMode(null); setEditTarget(null); }
  function handleFieldChange(field: keyof FormState, value: string) { setForm(prev => ({ ...prev, [field]: value })); }

  function handleSubmit() {
    const payload = formToPayload(form);
    if (modalMode === 'create') {
      createMutation.mutate(payload);
    } else if (modalMode === 'edit' && editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: { ...payload, analysis_data: editTarget.analysis_data } });
    }
  }

  function handleDelete(a: RealEstateAnalysis) {
    const name = a.property_name ?? `항목 #${a.id}`;
    if (window.confirm(`"${name}" 항목을 삭제하시겠습니까?`)) deleteMutation.mutate(a.id);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const fmtNum = (v: number | null) => v != null ? v.toLocaleString() : '-';
  const fmtPct = (v: number | null) => v != null ? `${v}%` : '-';

  const tabStyle = (key: Tab): React.CSSProperties => ({
    padding: 'var(--md-space-sm) var(--md-space-md)', font: 'var(--md-label-large)', border: 'none',
    borderBottom: activeTab === key ? '2px solid var(--md-sys-light-primary)' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === key ? 'var(--md-sys-light-primary)' : 'var(--md-sys-light-on-surface-variant)',
    cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' as const,
  });

  if (isLoading) return <div style={cardStyle}><p>로딩 중...</p></div>;
  if (error) return <div style={cardStyle}><p style={{ color: 'rgba(186,26,26,0.9)' }}>오류가 발생했습니다.</p></div>;

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-space-md)' }}>
        <div>
          <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: '0 0 4px' }}>부동산 수익분석</h2>
          <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: 0 }}>{analyses.length}건</p>
        </div>
        <button style={btnPrimary} onClick={openCreate}>+ 추가</button>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--md-sys-light-outline-variant)', marginBottom: 'var(--md-space-md)', gap: '4px' }}>
        {(['목록', '차트'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
            {t}
            {t === '목록' && (
              <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '999px', font: 'var(--md-label-small)', backgroundColor: activeTab === '목록' ? 'var(--md-sys-light-primary)' : 'var(--md-sys-light-surface-container-high)', color: activeTab === '목록' ? 'var(--md-sys-light-on-primary)' : 'var(--md-sys-light-on-surface-variant)' }}>
                {analyses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === '목록' && (
        analyses.length === 0 ? (
          <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>
            등록된 부동산 수익분석 데이터가 없습니다.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  {['부동산명', '총 취득원가', '자기자본', '대출자본', '현재 시세', '미실현 이익', 'ROE', '레버리지', '가속도', ''].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyses.map(a => (
                  <tr key={a.id}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{a.property_name ?? `부동산 #${a.id}`}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(a.total_acquisition_cost)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(a.self_capital)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(a.loan_capital)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(a.current_market_value)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(a.unrealized_gain)}</td>
                    <td style={tdStyle}>{fmtPct(a.roe)}</td>
                    <td style={tdStyle}>{a.leverage_multiple != null ? a.leverage_multiple : '-'}</td>
                    <td style={tdStyle}>{a.acceleration_factor != null ? a.acceleration_factor : '-'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={btnSecondary} onClick={() => openEdit(a)}>편집</button>
                        <button style={btnDanger} onClick={() => handleDelete(a)} disabled={deleteMutation.isPending}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === '차트' && (
        analyses.length > 0
          ? <RealEstateCharts analyses={analyses} />
          : <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>데이터가 없습니다.</p>
      )}

      {/* 모달 */}
      {modalMode !== null && (
        <RealEstateModal
          title={modalMode === 'create' ? '부동산 수익분석 추가' : '부동산 수익분석 편집'}
          form={form} onChange={handleFieldChange} onSubmit={handleSubmit} onCancel={closeModal}
          submitting={isSubmitting} submitLabel={modalMode === 'create' ? '추가' : '저장'}
        />
      )}
    </div>
  );
}

export default RealEstateStatus;
