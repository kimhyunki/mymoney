import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense } from '@/lib/api';
import type { FixedExpense, FixedExpenseCreate, FixedExpenseUpdate } from '@/types';
import FixedExpenseDetailView from './FixedExpenseDetailView';
import YearTabs from './YearTabs';

// ── 스타일 상수 ───────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: 'var(--md-space-lg)',
  boxShadow: 'var(--md-shadow-soft)',
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 14px', borderRadius: '6px', border: 'none',
  backgroundColor: 'var(--md-sys-light-primary)', color: 'var(--md-sys-light-on-primary)',
  font: 'var(--md-label-medium)', cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--md-sys-light-outline-variant)',
  backgroundColor: 'var(--md-sys-light-surface)', color: 'var(--md-sys-light-on-surface)',
  font: 'var(--md-label-small)', cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px', borderRadius: '6px',
  border: '1px solid var(--md-sys-light-outline-variant)',
  backgroundColor: 'var(--md-sys-light-surface)', color: 'var(--md-sys-light-on-surface)',
  font: 'var(--md-body-small)', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)',
  marginBottom: '4px', display: 'block',
};

// ── Modal ────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: 'var(--md-sys-light-surface-container)', borderRadius: 'var(--md-radius-lg)', border: '1px solid var(--md-sys-light-outline-variant)', padding: '24px', width: '480px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--md-sys-light-on-surface-variant)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── 폼 ───────────────────────────────────────────────────────
interface FormData { account_number: string; bank_name: string; account_holder: string; transfer_name: string; category: string; item_name: string; monthly_amount: string; }

function toFormData(fe: FixedExpense): FormData {
  return { account_number: fe.account_number ?? '', bank_name: fe.bank_name ?? '', account_holder: fe.account_holder ?? '', transfer_name: fe.transfer_name ?? '', category: fe.category, item_name: fe.item_name, monthly_amount: fe.monthly_amount != null ? String(fe.monthly_amount) : '' };
}

function fromFormData(fd: FormData): FixedExpenseCreate {
  const amount = fd.monthly_amount.trim() !== '' ? Number(fd.monthly_amount) : null;
  return { account_number: fd.account_number.trim() || null, bank_name: fd.bank_name.trim() || null, account_holder: fd.account_holder.trim() || null, transfer_name: fd.transfer_name.trim() || null, category: fd.category.trim(), item_name: fd.item_name.trim(), monthly_amount: isNaN(amount as number) ? null : amount };
}

function ExpenseForm({ initial, onSubmit, onCancel, isLoading, submitLabel }: { initial: FormData; onSubmit: (d: FixedExpenseCreate) => void; onCancel: () => void; isLoading: boolean; submitLabel: string }) {
  const [fd, setFd] = useState<FormData>(initial);
  const handle = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => setFd((p) => ({ ...p, [field]: e.target.value }));

  const fieldRow = (label: string, field: keyof FormData, required = false) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: 'rgba(186,26,26,0.9)' }}> *</span>}</label>
      <input style={inputStyle} value={fd[field]} onChange={handle(field)} required={required} type={field === 'monthly_amount' ? 'number' : 'text'} placeholder={field === 'monthly_amount' ? '0' : ''} />
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!fd.category.trim() || !fd.item_name.trim()) return; onSubmit(fromFormData(fd)); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div>{fieldRow('계좌번호', 'account_number')}</div>
        <div>{fieldRow('은행명', 'bank_name')}</div>
        <div>{fieldRow('예금주', 'account_holder')}</div>
        <div>{fieldRow('이체명', 'transfer_name')}</div>
        <div>{fieldRow('성향 (category)', 'category', true)}</div>
        <div>{fieldRow('항목명', 'item_name', true)}</div>
        <div style={{ gridColumn: '1 / -1' }}>{fieldRow('월금액 (원)', 'monthly_amount')}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" style={btnSecondary} onClick={onCancel} disabled={isLoading}>취소</button>
        <button type="submit" style={btnPrimary} disabled={isLoading}>{isLoading ? '저장 중...' : submitLabel}</button>
      </div>
    </form>
  );
}

// ── 메인 ─────────────────────────────────────────────────────
type ModalMode = 'add' | 'edit' | null;

export default function FixedExpenseStatus() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<FixedExpense | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const { data: fixedExpenses = [], isLoading, error } = useQuery({
    queryKey: ['fixedExpenses'],
    queryFn: getFixedExpenses,
    refetchInterval: 30000,
  });

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    fixedExpenses.forEach((fe) => {
      Object.keys(fe.monthly_data ?? {}).forEach((k) => {
        const y = parseInt(k.slice(0, 4));
        if (y >= 2000) years.add(y);
      });
    });
    return Array.from(years).sort();
  }, [fixedExpenses]);

  const effectiveYear = selectedYear ?? (availableYears.at(-1) ?? null);

  const yearFilteredExpenses = useMemo(() => {
    if (!effectiveYear) return fixedExpenses;
    return fixedExpenses.map((fe) => ({
      ...fe,
      monthly_amount: null, // 연도 필터링 시 monthly_amount 무효화 → monthly_data 기반 재계산
      monthly_data: Object.fromEntries(
        Object.entries(fe.monthly_data ?? {}).filter(([k]) => k.startsWith(`${effectiveYear}-`))
      ),
    }));
  }, [fixedExpenses, effectiveYear]);

  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    yearFilteredExpenses.forEach((fe) => {
      Object.keys(fe.monthly_data ?? {}).forEach((k) => months.add(parseInt(k.slice(5, 7))));
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [yearFilteredExpenses]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(null);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ['fixedExpenses'] });

  const createMut = useMutation({ mutationFn: createFixedExpense, onSuccess: () => { invalidate(); setModalMode(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: FixedExpenseUpdate }) => updateFixedExpense(id, data), onSuccess: () => { invalidate(); setModalMode(null); setEditTarget(null); } });
  const deleteMut = useMutation({ mutationFn: deleteFixedExpense, onSuccess: invalidate });

  const handleEdit = (item: FixedExpense) => { setEditTarget(item); setModalMode('edit'); };
  const handleDelete = (item: FixedExpense) => { if (!window.confirm(`"${item.item_name}" 항목을 삭제하시겠습니까?`)) return; deleteMut.mutate(item.id); };
  const handleClose = () => { setModalMode(null); setEditTarget(null); };

  const initialFormData: FormData = editTarget ? toFormData(editTarget) : { account_number: '', bank_name: '', account_holder: '', transfer_name: '', category: '', item_name: '', monthly_amount: '' };

  const totalMonthly = useMemo(() => {
    if (effectiveYear) {
      const yearSum = yearFilteredExpenses.reduce(
        (s, fe) => s + Object.values(fe.monthly_data ?? {}).reduce((ms, v) => ms + (v ?? 0), 0),
        0
      );
      return availableMonths.length > 0 ? Math.round(yearSum / availableMonths.length) : 0;
    }
    return fixedExpenses.reduce((s, i) => s + (i.monthly_amount ?? 0), 0);
  }, [effectiveYear, yearFilteredExpenses, availableMonths, fixedExpenses]);

  const btnMonth = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 'var(--md-radius-sm)',
    border: active ? '2px solid var(--md-sys-light-secondary)' : '1px solid var(--md-sys-light-outline-variant)',
    background: active ? 'var(--md-sys-light-secondary-container)' : 'var(--md-sys-light-surface)',
    color: active ? 'var(--md-sys-light-on-secondary-container)' : 'var(--md-sys-light-on-surface-variant)',
    font: 'var(--md-label-medium)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  if (isLoading) return <div style={cardStyle}><p>로딩 중...</p></div>;
  if (error) return <div style={cardStyle}><p style={{ color: 'rgba(186,26,26,0.9)' }}>오류가 발생했습니다.</p></div>;

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-space-md)' }}>
        <div>
          <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: '0 0 4px' }}>고정비 현황</h2>
          <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: 0 }}>
            월 합계 <strong style={{ color: 'var(--md-sys-light-on-surface)' }}>{totalMonthly.toLocaleString()}원</strong> · {fixedExpenses.length}건
          </p>
        </div>
        <button style={btnPrimary} onClick={() => { setEditTarget(null); setModalMode('add'); }}>+ 추가</button>
      </div>

      {/* 연도 탭 */}
      {availableYears.length > 0 && effectiveYear != null && (
        <YearTabs years={availableYears} selected={effectiveYear} onChange={handleYearChange} />
      )}

      {/* 월 탭 */}
      {availableMonths.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedMonth(null)} style={btnMonth(selectedMonth === null)}>전체</button>
          {availableMonths.map((m) => (
            <button key={m} onClick={() => setSelectedMonth(m)} style={btnMonth(selectedMonth === m)}>{m}월</button>
          ))}
        </div>
      )}

      {/* 콘텐츠 */}
      {effectiveYear !== null ? (
        <FixedExpenseDetailView
          fixedExpenses={yearFilteredExpenses}
          year={effectiveYear}
          month={selectedMonth}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>데이터가 없습니다.</p>
      )}

      {/* 모달 */}
      {modalMode === 'add' && (
        <Modal title="고정비 추가" onClose={handleClose}>
          <ExpenseForm initial={initialFormData} onSubmit={(d) => createMut.mutate(d)} onCancel={handleClose} isLoading={createMut.isPending} submitLabel="추가" />
          {createMut.isError && <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>오류: {(createMut.error as Error).message}</p>}
        </Modal>
      )}
      {modalMode === 'edit' && editTarget && (
        <Modal title="고정비 편집" onClose={handleClose}>
          <ExpenseForm key={editTarget.id} initial={initialFormData} onSubmit={(d) => updateMut.mutate({ id: editTarget.id, data: d })} onCancel={handleClose} isLoading={updateMut.isPending} submitLabel="저장" />
          {updateMut.isError && <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>오류: {(updateMut.error as Error).message}</p>}
        </Modal>
      )}
    </div>
  );
}
