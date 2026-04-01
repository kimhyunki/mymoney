import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFinancialGoals,
  createFinancialGoal,
  updateFinancialGoal,
  deleteFinancialGoal,
} from '@/lib/api';
import type { FinancialGoal, FinancialGoalCreate, FinancialGoalUpdate, FinancialGoalItem } from '@/types';
import FinancialGoalCharts from './FinancialGoalCharts';

type Tab = '목록' | '차트';
type ActualTab = '계획' | '실적';

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

// ── 폼 타입 (날짜 계산 항목 제외) ────────────────────────────
type FormState = {
  goal_name: string; target_amount: string; start_date: string; end_date: string;
  interest_rate: string; weekly_allocation: string;
};

const emptyForm = (): FormState => ({
  goal_name: '', target_amount: '', start_date: '', end_date: '',
  interest_rate: '', weekly_allocation: '',
});

function goalToForm(g: FinancialGoal): FormState {
  return {
    goal_name: g.goal_name ?? '',
    target_amount: g.target_amount != null ? String(g.target_amount) : '',
    start_date: g.start_date ?? '', end_date: g.end_date ?? '',
    interest_rate: g.interest_rate != null ? String(g.interest_rate) : '',
    weekly_allocation: g.weekly_allocation != null ? String(g.weekly_allocation) : '',
  };
}

function parseNum(v: string): number | null {
  const n = parseFloat(v.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

// 시작일·종료일로부터 주수/진행률 자동 계산
function calcGoalDerived(startDate: string, endDate: string) {
  if (!startDate || !endDate) return { total_weeks: null, elapsed_weeks: null, remaining_weeks: null, progress_rate: null };
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const total_weeks = Math.ceil((end - start) / WEEK_MS);
  const elapsed_weeks = Math.max(0, Math.floor((today - start) / WEEK_MS));
  const remaining_weeks = Math.max(0, total_weeks - elapsed_weeks);
  const progress_rate = total_weeks > 0 ? elapsed_weeks / total_weeks : null;
  return { total_weeks, elapsed_weeks, remaining_weeks, progress_rate };
}

function formToPayload(f: FormState): FinancialGoalCreate {
  const derived = calcGoalDerived(f.start_date, f.end_date);
  return {
    goal_name: f.goal_name, target_amount: parseNum(f.target_amount),
    start_date: f.start_date || null, end_date: f.end_date || null,
    interest_rate: parseNum(f.interest_rate), weekly_allocation: parseNum(f.weekly_allocation),
    ...derived,
  };
}

// ── Modal ────────────────────────────────────────────────────
function GoalModal({ title, form, onChange, onSubmit, onCancel, submitting, submitLabel }: {
  title: string; form: FormState; onChange: (field: keyof FormState, value: string) => void;
  onSubmit: () => void; onCancel: () => void; submitting: boolean; submitLabel: string;
}) {
  const derived = calcGoalDerived(form.start_date, form.end_date);

  const field = (key: keyof FormState, label: string, type = 'text', placeholder = '') => (
    <label style={labelStyle}>
      {label}
      <input type={type} style={inputStyle} value={form[key]} placeholder={placeholder}
        onChange={e => onChange(key, e.target.value)} />
    </label>
  );

  const calcField = (label: string, value: number | null, fmt: (v: number) => string) => (
    <label style={labelStyle}>
      <span>{label} <span style={{ color: 'var(--md-sys-light-primary)', fontSize: '0.85em' }}>자동계산</span></span>
      <div style={{ ...inputStyle, backgroundColor: 'var(--md-sys-light-surface-container)', color: 'var(--md-sys-light-on-surface-variant)', cursor: 'default' }}>
        {value != null ? fmt(value) : '—'}
      </div>
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
          {calcField('총 주수', derived.total_weeks, v => `${v}주`)}
          {calcField('경과 주수', derived.elapsed_weeks, v => `${v}주`)}
          {calcField('잔여 주수', derived.remaining_weeks, v => `${v}주`)}
          {calcField('진행률', derived.progress_rate, v => `${(v * 100).toFixed(1)}%`)}
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

// ── 납부 내역 모달 ────────────────────────────────────────────
interface ActualItemForm {
  date: string; category: string; item: string; amount: string; balance: string;
}

const emptyActualForm = (): ActualItemForm => ({ date: '', category: '분양금', item: '', amount: '', balance: '' });

function ActualDataModal({ goal, onClose, onSave }: {
  goal: FinancialGoal;
  onClose: () => void;
  onSave: (actualData: FinancialGoalItem[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<ActualTab>('실적');
  const [actualItems, setActualItems] = useState<FinancialGoalItem[]>(goal.actual_data ?? []);
  const [form, setForm] = useState<ActualItemForm>(emptyActualForm());
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [plannedPage, setPlannedPage] = useState(0);
  const PAGE_SIZE = 15;

  const plannedItems = goal.planned_data ?? [];
  const totalPages = Math.ceil(plannedItems.length / PAGE_SIZE);
  const pagedPlanned = plannedItems.slice(plannedPage * PAGE_SIZE, (plannedPage + 1) * PAGE_SIZE);

  const fmtNum = (v: number | null | undefined) => v != null ? v.toLocaleString() : '-';

  function startEdit(idx: number) {
    const item = actualItems[idx];
    setForm({ date: item.date ?? '', category: item.category ?? '분양금', item: item.item, amount: String(item.amount), balance: item.balance != null ? String(item.balance) : '' });
    setEditIdx(idx);
  }

  function cancelEdit() { setForm(emptyActualForm()); setEditIdx(null); }

  function saveEntry() {
    if (!form.item.trim() || !form.amount) return;
    const entry: FinancialGoalItem = {
      date: form.date || null,
      category: form.category || null,
      item: form.item.trim(),
      amount: parseFloat(form.amount),
      balance: form.balance ? parseFloat(form.balance) : null,
    };
    if (editIdx !== null) {
      setActualItems(prev => prev.map((it, i) => i === editIdx ? entry : it));
    } else {
      setActualItems(prev => [...prev, entry]);
    }
    setForm(emptyActualForm());
    setEditIdx(null);
  }

  function removeEntry(idx: number) {
    setActualItems(prev => prev.filter((_, i) => i !== idx));
  }

  const tabStyle = (t: ActualTab): React.CSSProperties => ({
    padding: '8px 16px', border: 'none',
    borderBottom: activeTab === t ? '2px solid var(--md-sys-light-primary)' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === t ? 'var(--md-sys-light-primary)' : 'var(--md-sys-light-on-surface-variant)',
    font: 'var(--md-label-large)', cursor: 'pointer', whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: 'var(--md-sys-light-surface)', borderRadius: 'var(--md-radius-lg)', border: '1px solid var(--md-sys-light-outline-variant)', padding: '28px 32px', width: '700px', maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--md-shadow-soft)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ font: 'var(--md-title-medium)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
            {goal.goal_name} — 납부 내역
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', font: 'var(--md-label-large)', cursor: 'pointer', color: 'var(--md-sys-light-on-surface-variant)' }}>✕</button>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--md-sys-light-outline-variant)' }}>
          {(['실적', '계획'] as ActualTab[]).map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 실적 탭 */}
          {activeTab === '실적' && (
            <>
              {/* 입력 폼 */}
              <div style={{ backgroundColor: 'var(--md-sys-light-surface-container)', borderRadius: 'var(--md-radius-sm)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                  {editIdx !== null ? `${editIdx + 1}번 항목 편집` : '납부 내역 추가'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...inputStyle, fontSize: '0.85em' }} placeholder="날짜" />
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, fontSize: '0.85em' }} placeholder="분류" />
                  <input value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} style={{ ...inputStyle, fontSize: '0.85em' }} placeholder="항목명 *" />
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ ...inputStyle, fontSize: '0.85em' }} placeholder="금액 *" />
                  <input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} style={{ ...inputStyle, fontSize: '0.85em' }} placeholder="잔액" />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={btnPrimary} onClick={saveEntry} disabled={!form.item.trim() || !form.amount}>
                    {editIdx !== null ? '수정' : '추가'}
                  </button>
                  {editIdx !== null && <button style={btnSecondary} onClick={cancelEdit}>취소</button>}
                </div>
              </div>

              {/* 실적 목록 */}
              {actualItems.length === 0 ? (
                <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'center', padding: '16px' }}>
                  납부 내역이 없습니다.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['날짜', '분류', '항목', '금액', '잔액', ''].map(h => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {actualItems.map((item, idx) => (
                        <tr key={idx} style={{ backgroundColor: editIdx === idx ? 'color-mix(in srgb, var(--md-sys-light-primary) 8%, transparent)' : undefined }}>
                          <td style={tdStyle}>{item.date ?? '-'}</td>
                          <td style={tdStyle}>{item.category ?? '-'}</td>
                          <td style={tdStyle}>{item.item}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--md-sys-light-primary)' }}>₩{fmtNum(item.amount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{item.balance != null ? `₩${fmtNum(item.balance)}` : '-'}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button style={btnSecondary} onClick={() => startEdit(idx)}>편집</button>
                              <button style={btnDanger} onClick={() => removeEntry(idx)}>삭제</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* 계획 탭 (read-only) */}
          {activeTab === '계획' && (
            <>
              {plannedItems.length === 0 ? (
                <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'center', padding: '16px' }}>
                  계획 데이터가 없습니다.
                </p>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['날짜', '분류', '항목', '금액', '잔액'].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPlanned.map((item, idx) => (
                          <tr key={idx}>
                            <td style={tdStyle}>{item.date ?? '-'}</td>
                            <td style={tdStyle}>{item.category ?? '-'}</td>
                            <td style={tdStyle}>{item.item}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--md-sys-light-primary)' }}>₩{fmtNum(item.amount)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{item.balance != null ? `₩${fmtNum(item.balance)}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', padding: '8px' }}>
                      <button style={btnSecondary} disabled={plannedPage === 0} onClick={() => setPlannedPage(p => p - 1)}>‹</button>
                      <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                        {plannedPage + 1} / {totalPages}
                      </span>
                      <button style={btnSecondary} disabled={plannedPage >= totalPages - 1} onClick={() => setPlannedPage(p => p + 1)}>›</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--md-sys-light-outline-variant)' }}>
          <button style={btnSecondary} onClick={onClose}>취소</button>
          <button style={btnPrimary} onClick={() => onSave(actualItems)}>저장</button>
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
  const [actualModalGoal, setActualModalGoal] = useState<FinancialGoal | null>(null);

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

  function handleSaveActual(actualData: FinancialGoalItem[]) {
    if (!actualModalGoal) return;
    const payload = formToPayload(goalToForm(actualModalGoal));
    updateMutation.mutate({
      id: actualModalGoal.id,
      data: { ...payload, planned_data: actualModalGoal.planned_data, actual_data: actualData },
    });
    setActualModalGoal(null);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const fmtNum = (v: number | null) => v != null ? v.toLocaleString() : '-';

  function computedGoalRow(g: FinancialGoal) {
    const d = calcGoalDerived(g.start_date ?? '', g.end_date ?? '');
    return {
      total_weeks: d.total_weeks != null ? `${d.total_weeks}주` : '-',
      elapsed_weeks: d.elapsed_weeks != null ? `${d.elapsed_weeks}주` : '-',
      remaining_weeks: d.remaining_weeks != null ? `${d.remaining_weeks}주` : '-',
      progress_rate: d.progress_rate != null ? `${(d.progress_rate * 100).toFixed(1)}%` : '-',
    };
  }

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
                {goals.map(g => {
                  const calc = computedGoalRow(g);
                  return (
                  <tr key={g.id}>
                    <td style={tdStyle}>{g.goal_name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(g.target_amount)}</td>
                    <td style={tdStyle}>{g.start_date ?? '-'}</td>
                    <td style={tdStyle}>{g.end_date ?? '-'}</td>
                    <td style={{ ...tdStyle, color: 'var(--md-sys-light-primary)' }}>{calc.progress_rate}</td>
                    <td style={{ ...tdStyle, color: 'var(--md-sys-light-primary)' }}>{calc.total_weeks}</td>
                    <td style={{ ...tdStyle, color: 'var(--md-sys-light-primary)' }}>{calc.elapsed_weeks}</td>
                    <td style={{ ...tdStyle, color: 'var(--md-sys-light-primary)' }}>{calc.remaining_weeks}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtNum(g.weekly_allocation)}</td>
                    <td style={tdStyle}>{g.interest_rate != null ? `${g.interest_rate}%` : '-'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={{ ...btnSecondary, color: '#1a7f37', borderColor: '#1a7f37' }} onClick={() => setActualModalGoal(g)}>납부</button>
                        <button style={btnSecondary} onClick={() => openEdit(g)}>편집</button>
                        <button style={btnDanger} onClick={() => handleDelete(g)} disabled={deleteMutation.isPending}>삭제</button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
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

      {/* 분양금 목표 모달 */}
      {modalMode !== null && (
        <GoalModal
          title={modalMode === 'create' ? '분양금 계획 추가' : '분양금 계획 편집'}
          form={form} onChange={handleFieldChange} onSubmit={handleSubmit} onCancel={closeModal}
          submitting={isSubmitting} submitLabel={modalMode === 'create' ? '추가' : '저장'}
        />
      )}

      {/* 납부 내역 모달 */}
      {actualModalGoal !== null && (
        <ActualDataModal
          goal={actualModalGoal}
          onClose={() => setActualModalGoal(null)}
          onSave={handleSaveActual}
        />
      )}
    </div>
  );
}

export default FinancialGoalStatus;
