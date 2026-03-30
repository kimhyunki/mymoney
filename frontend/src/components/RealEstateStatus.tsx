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

// ── 스타일 ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: 'var(--md-space-lg)',
  boxShadow: 'var(--md-shadow-soft)',
};

const titleStyle: React.CSSProperties = {
  font: 'var(--md-title-small)',
  color: 'var(--md-sys-light-on-surface)',
  marginBottom: 'var(--md-space-md)',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--md-space-md)',
};

const btnPrimaryStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-primary)',
  color: 'var(--md-sys-light-on-primary)',
  border: 'none',
  borderRadius: 'var(--md-radius-sm)',
  padding: '6px 14px',
  font: 'var(--md-label-medium)',
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'var(--md-sys-light-primary)',
  border: '1px solid var(--md-sys-light-primary)',
  borderRadius: 'var(--md-radius-sm)',
  padding: '4px 10px',
  font: 'var(--md-label-small)',
  cursor: 'pointer',
};

const btnDangerStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'var(--md-sys-light-error, #ba1a1a)',
  border: '1px solid var(--md-sys-light-error, #ba1a1a)',
  borderRadius: 'var(--md-radius-sm)',
  padding: '4px 10px',
  font: 'var(--md-label-small)',
  cursor: 'pointer',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
  marginBottom: 'var(--md-space-md)',
};

const itemCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container-high)',
  borderRadius: 'var(--md-radius-md)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: '16px',
};

const itemCardTitleStyle: React.CSSProperties = {
  font: 'var(--md-label-large)',
  color: 'var(--md-sys-light-on-surface)',
  marginBottom: '10px',
  wordBreak: 'break-all',
};

const itemCardRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  font: 'var(--md-body-small)',
  color: 'var(--md-sys-light-on-surface-variant)',
  marginBottom: '5px',
};

const itemCardValueStyle: React.CSSProperties = {
  color: 'var(--md-sys-light-on-surface)',
  fontWeight: 500,
};

const itemCardActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '12px',
  paddingTop: '10px',
  borderTop: '1px solid var(--md-sys-light-outline-variant)',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: '28px 32px',
  width: '520px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: 'var(--md-shadow-soft)',
};

const modalTitleStyle: React.CSSProperties = {
  font: 'var(--md-title-medium)',
  color: 'var(--md-sys-light-on-surface)',
  marginBottom: '20px',
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px 16px',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  font: 'var(--md-label-medium)',
  color: 'var(--md-sys-light-on-surface-variant)',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container-high)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  borderRadius: 'var(--md-radius-sm)',
  padding: '7px 10px',
  font: 'var(--md-body-small)',
  color: 'var(--md-sys-light-on-surface)',
  outline: 'none',
};

const modalFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '22px',
};

// ── 폼 상태 ───────────────────────────────────────────────────────────────────

type FormState = {
  property_name: string;
  total_acquisition_cost: string;
  self_capital: string;
  loan_capital: string;
  current_market_value: string;
  unrealized_gain: string;
  roe: string;
  leverage_multiple: string;
  acceleration_factor: string;
};

const emptyForm = (): FormState => ({
  property_name: '',
  total_acquisition_cost: '',
  self_capital: '',
  loan_capital: '',
  current_market_value: '',
  unrealized_gain: '',
  roe: '',
  leverage_multiple: '',
  acceleration_factor: '',
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
    self_capital: parseNum(f.self_capital),
    loan_capital: parseNum(f.loan_capital),
    current_market_value: parseNum(f.current_market_value),
    unrealized_gain: parseNum(f.unrealized_gain),
    roe: parseNum(f.roe),
    leverage_multiple: parseNum(f.leverage_multiple),
    acceleration_factor: parseNum(f.acceleration_factor),
  };
}

// ── 인라인 모달 ───────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}

function RealEstateModal({ title, form, onChange, onSubmit, onCancel, submitting, submitLabel }: ModalProps) {
  const field = (key: keyof FormState, label: string, placeholder = '') => (
    <label style={labelStyle}>
      {label}
      <input
        type="number"
        style={inputStyle}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => onChange(key, e.target.value)}
      />
    </label>
  );

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h3 style={modalTitleStyle}>{title}</h3>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>
            부동산명
            <input
              type="text"
              style={inputStyle}
              value={form.property_name}
              placeholder="예: 래미안 아파트"
              onChange={e => onChange('property_name', e.target.value)}
            />
          </label>
        </div>
        <div style={formGridStyle}>
          {field('total_acquisition_cost', '총 취득원가', '0')}
          {field('self_capital', '자기자본', '0')}
          {field('loan_capital', '대출자본', '0')}
          {field('current_market_value', '현재 시세', '0')}
          {field('unrealized_gain', '미실현 이익', '0')}
          <label style={labelStyle}>
            ROE (%)
            <input
              type="number"
              style={inputStyle}
              value={form.roe}
              placeholder="0"
              onChange={e => onChange('roe', e.target.value)}
            />
          </label>
          <label style={labelStyle}>
            레버리지 배수
            <input
              type="number"
              style={inputStyle}
              value={form.leverage_multiple}
              placeholder="0"
              onChange={e => onChange('leverage_multiple', e.target.value)}
            />
          </label>
          <label style={labelStyle}>
            가속도 인수
            <input
              type="number"
              style={inputStyle}
              value={form.acceleration_factor}
              placeholder="0"
              onChange={e => onChange('acceleration_factor', e.target.value)}
            />
          </label>
        </div>
        <div style={modalFooterStyle}>
          <button style={btnSecondaryStyle} onClick={onCancel} disabled={submitting}>
            취소
          </button>
          <button style={btnPrimaryStyle} onClick={onSubmit} disabled={submitting}>
            {submitting ? '저장 중...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

function RealEstateStatus() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<RealEstateAnalysis | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data: analyses = [], isLoading, error } = useQuery({
    queryKey: ['realEstateAnalyses'],
    queryFn: () => getRealEstateAnalyses(),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: RealEstateAnalysisCreate) => createRealEstateAnalysis(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['realEstateAnalyses'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RealEstateAnalysisUpdate }) =>
      updateRealEstateAnalysis(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['realEstateAnalyses'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRealEstateAnalysis(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['realEstateAnalyses'] }),
  });

  function openCreate() {
    setForm(emptyForm());
    setEditTarget(null);
    setModalMode('create');
  }

  function openEdit(a: RealEstateAnalysis) {
    setForm(analysisToForm(a));
    setEditTarget(a);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
  }

  function handleFieldChange(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    const payload = formToPayload(form);
    if (modalMode === 'create') {
      createMutation.mutate(payload);
    } else if (modalMode === 'edit' && editTarget) {
      // analysis_data는 기존 값 유지
      updateMutation.mutate({
        id: editTarget.id,
        data: { ...payload, analysis_data: editTarget.analysis_data },
      });
    }
  }

  function handleDelete(a: RealEstateAnalysis) {
    const name = a.property_name ?? `항목 #${a.id}`;
    if (window.confirm(`"${name}" 항목을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(a.id);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const fmtNum = (v: number | null) => (v != null ? v.toLocaleString() : '-');
  const fmtPct = (v: number | null) => (v != null ? `${v}%` : '-');

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={headerRowStyle}>
        <h2 style={{ ...titleStyle, marginBottom: 0 }}>부동산 수익분석</h2>
        <button style={btnPrimaryStyle} onClick={openCreate}>
          + 추가
        </button>
      </div>

      {/* 로딩 / 오류 */}
      {isLoading && (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          로딩 중...
        </p>
      )}
      {error && (
        <p style={{ font: 'var(--md-body-medium)', color: 'rgba(186,26,26,0.9)' }}>
          부동산 수익분석을 불러오는 중 오류가 발생했습니다.
        </p>
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && analyses.length === 0 && (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          등록된 부동산 수익분석 데이터가 없습니다. Excel 파일을 업로드하거나 직접 추가하세요.
        </p>
      )}

      {/* 카드 그리드 */}
      {!isLoading && !error && analyses.length > 0 && (
        <>
          <div style={gridStyle}>
            {analyses.map(a => (
              <div key={a.id} style={itemCardStyle}>
                <div style={itemCardTitleStyle}>
                  {a.property_name ?? `부동산 #${a.id}`}
                </div>
                <div style={itemCardRowStyle}>
                  <span>총 취득원가</span>
                  <span style={itemCardValueStyle}>{fmtNum(a.total_acquisition_cost)}</span>
                </div>
                <div style={itemCardRowStyle}>
                  <span>자기자본</span>
                  <span style={itemCardValueStyle}>{fmtNum(a.self_capital)}</span>
                </div>
                <div style={itemCardRowStyle}>
                  <span>대출자본</span>
                  <span style={itemCardValueStyle}>{fmtNum(a.loan_capital)}</span>
                </div>
                <div style={itemCardRowStyle}>
                  <span>현재 시세</span>
                  <span style={itemCardValueStyle}>{fmtNum(a.current_market_value)}</span>
                </div>
                <div style={itemCardRowStyle}>
                  <span>미실현 이익</span>
                  <span style={itemCardValueStyle}>{fmtNum(a.unrealized_gain)}</span>
                </div>
                <div style={itemCardRowStyle}>
                  <span>ROE</span>
                  <span style={itemCardValueStyle}>{fmtPct(a.roe)}</span>
                </div>
                <div style={itemCardRowStyle}>
                  <span>레버리지 배수</span>
                  <span style={itemCardValueStyle}>{a.leverage_multiple != null ? a.leverage_multiple : '-'}</span>
                </div>
                <div style={itemCardRowStyle}>
                  <span>가속도 인수</span>
                  <span style={itemCardValueStyle}>{a.acceleration_factor != null ? a.acceleration_factor : '-'}</span>
                </div>
                <div style={itemCardActionsStyle}>
                  <button style={btnSecondaryStyle} onClick={() => openEdit(a)}>
                    편집
                  </button>
                  <button
                    style={btnDangerStyle}
                    onClick={() => handleDelete(a)}
                    disabled={deleteMutation.isPending}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 차트 */}
          <RealEstateCharts analyses={analyses} />
        </>
      )}

      {/* 푸터 */}
      <div
        style={{
          marginTop: 'var(--md-space-md)',
          paddingTop: 'var(--md-space-md)',
          borderTop: '1px solid var(--md-sys-light-outline-variant)',
        }}
      >
        <p
          style={{
            font: 'var(--md-label-small)',
            color: 'var(--md-sys-light-on-surface-variant)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          부동산 수익분석은 30초마다 자동으로 업데이트됩니다.
        </p>
      </div>

      {/* 모달 */}
      {modalMode !== null && (
        <RealEstateModal
          title={modalMode === 'create' ? '부동산 수익분석 추가' : '부동산 수익분석 편집'}
          form={form}
          onChange={handleFieldChange}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={isSubmitting}
          submitLabel={modalMode === 'create' ? '추가' : '저장'}
        />
      )}
    </div>
  );
}

export default RealEstateStatus;
