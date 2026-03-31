import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFinancialGoals,
  createFinancialGoal,
  updateFinancialGoal,
  deleteFinancialGoal,
} from '@/lib/api';
import type { FinancialGoal, FinancialGoalCreate, FinancialGoalUpdate } from '@/types';
import FinancialGoalCharts from './FinancialGoalCharts';

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
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px', borderBottom: '1px solid var(--md-sys-light-outline-variant)', whiteSpace: 'nowrap',
  font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)',
};

// ── 폼 타입 ───────────────────────────────────────────────────
type FormState = {
  goal_name: string; target_amount: string; start_date: string; end_date: string;
  interest_rate: string; total_weeks: string; elapsed_weeks: string;
  remaining_weeks: string; progress_rate: string; weekly_allocation: string;
};

const emptyForm = (): FormState => ({
  goal_name: '', target_amount: '', start_date: '', end_date: '',
  interest_rate: '', total_weeks: '', elapsed_weeks: '',
  remaining_weeks: '', progress_rate: '', weekly_allocation: '',
});

function goalToForm(g: FinancialGoal): FormState {
  return {
    goal_name: g.goal_name ?? '',
    target_amount: g.target_amount != null ? String(g.target_amount) : '',
    start_date: g.start_date ?? '', end_date: g.end_date ?? '',
    interest_rate: g.interest_rate != null ? String(g.interest_rate) : '',
    total_weeks: g.total_weeks != null ? String(g.total_weeks) : '',
    elapsed_weeks: g.elapsed_weeks != null ? String(g.elapsed_weeks) : '',
    remaining_weeks: g.remaining_weeks != null ? String(g.remaining_weeks) : '',
    progress_rate: g.progress_rate != null ? String(g.progress_rate) : '',
    weekly_allocation: g.weekly_allocation != null ? String(g.weekly_allocation) : '',
  };
}

function parseNum(v: string): number | null {
  const n = parseFloat(v.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function formToPayload(f: FormState): FinancialGoalCreate {
  return {
    goal_name: f.goal_name, target_amount: parseNum(f.target_amount),
    start_date: f.start_date || null, end_date: f.end_date || null,
    interest_rate: parseNum(f.interest_rate), total_weeks: parseNum(f.total_weeks),
    elapsed_weeks: parseNum(f.elapsed_weeks), remaining_weeks: parseNum(f.remaining_weeks),
    progress_rate: parseNum(f.progress_rate), weekly_allocation: parseNum(f.weekly_allocation),
  };
}

// ── Modal ────────────────────────────────────────────────────
function GoalModal({ title, form, onChange, onSubmit, onCancel, submitting, submitLabel }: {
  title: string; form: FormState; onChange: (field: keyof FormState, value: string) => void;
  onSubmit: () => void; onCancel: () => void; submitting: boolean; submitLabel: string;
}) {
  const field = (key: keyof FormState, label: string, type = 'text', placeholder = '') => (
    <label style={labelStyle}>
      {label}
      <input type={type} style={inputStyle} value={form[key]} placeholder={placeholder}
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
            목표명 <span style={{ color: 'var(--md-sys-light-error, #ba1a1a)' }}>*</span>
            <input type="text" style={inputStyle} value={form.goal_name} placeholder="예: 아파트 청약 준비"
              onChange={e => onChange('goal_name', e.target.value)} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          {field('target_amount', '목표금액', 'number', '0')}
          {field('weekly_allocation', '주간 배정액', 'number', '0')}
          {field('start_date', '시작일', 'date')}
          {field('end_date', '종료일', 'date')}
          {field('interest_rate', '이자율 (%)', 'number', '0')}
          {field('total_weeks', '총 주수', 'number', '0')}
          {field('elapsed_weeks', '경과 주수', 'number', '0')}
          {field('remaining_weeks', '잔여 주수', 'number', '0')}
          {field('progress_rate', '진행률 (%)', 'number', '0')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
          <button style={btnSecondary} onClick={onCancel} disabled={submitting}>취소</button>
          <button style={btnPrimary} onClick={onSubmit} disabled={submitting || !form.goal_name.trim()}>
            {submitting ? '저장 중...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
function FinancialGoalStatus() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('목록');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<FinancialGoal | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['financialGoals'],
    queryFn: () => getFinancialGoals(),
    refetchInterval: 30000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['financialGoals'] });

  const createMutation = useMutation({
    mutationFn: (data: FinancialGoalCreate) => createFinancialGoal(data),
    onSuccess: () => { invalidate(); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FinancialGoalUpdate }) => updateFinancialGoal(id, data),
    onSuccess: () => { invalidate(); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFinancialGoal(id),
    onSuccess: () => invalidate(),
  });

  function openCreate() { setForm(emptyForm()); setEditTarget(null); setModalMode('create'); }
  function openEdit(g: FinancialGoal) { setForm(goalToForm(g)); setEditTarget(g); setModalMode('edit'); }
  function closeModal() { setModalMode(null); setEditTarget(null); }
  function handleFieldChange(field: keyof FormState, value: string) { setForm(prev => ({ ...prev, [field]: value })); }

  function handleSubmit() {
    const payload = formToPayload(form);
    if (modalMode === 'create') {
      createMutation.mutate(payload);
    } else if (modalMode === 'edit' && editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: { ...payload, planned_data: editTarget.planned_data, actual_data: editTarget.actual_data } });
    }
  }

  function handleDelete(g: FinancialGoal) {
    if (window.confirm(`"${g.goal_name}" 항목을 삭제하시겠습니까?`)) deleteMutation.mutate(g.id);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const fmtNum = (v: number | null) => v != null ? v.toLocaleString() : '-';

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
          <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: '0 0 4px' }}>분양금 계획</h2>
          <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: 0 }}>{goals.length}건</p>
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
                {goals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === '목록' && (
        goals.length === 0 ? (
          <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>
            등록된 분양금 계획 데이터가 없습니다.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--md-body-small)', minWidth: '780px' }}>
              <thead>
                <tr>
                  {['목표명', '목표금액', '시작일', '종료일', '진행률', '총 주수', '경과', '잔여', '주간배정', '이자율', ''].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goals.map(g => (
                  <tr key={g.id}>
                    <td style={tdStyle}>{g.goal_name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(g.target_amount)}</td>
                    <td style={tdStyle}>{g.start_date ?? '-'}</td>
                    <td style={tdStyle}>{g.end_date ?? '-'}</td>
                    <td style={tdStyle}>{g.progress_rate != null ? `${g.progress_rate}%` : '-'}</td>
                    <td style={tdStyle}>{g.total_weeks ?? '-'}</td>
                    <td style={tdStyle}>{g.elapsed_weeks ?? '-'}</td>
                    <td style={tdStyle}>{g.remaining_weeks ?? '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(g.weekly_allocation)}</td>
                    <td style={tdStyle}>{g.interest_rate != null ? `${g.interest_rate}%` : '-'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={btnSecondary} onClick={() => openEdit(g)}>편집</button>
                        <button style={btnDanger} onClick={() => handleDelete(g)} disabled={deleteMutation.isPending}>삭제</button>
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
        goals.length > 0
          ? <FinancialGoalCharts goals={goals} />
          : <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>데이터가 없습니다.</p>
      )}

      {/* 모달 */}
      {modalMode !== null && (
        <GoalModal
          title={modalMode === 'create' ? '분양금 계획 추가' : '분양금 계획 편집'}
          form={form} onChange={handleFieldChange} onSubmit={handleSubmit} onCancel={closeModal}
          submitting={isSubmitting} submitLabel={modalMode === 'create' ? '추가' : '저장'}
        />
      )}
    </div>
  );
}

export default FinancialGoalStatus;
