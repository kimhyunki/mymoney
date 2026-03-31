import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense } from '@/lib/api';
import type { FixedExpense, FixedExpenseCreate, FixedExpenseUpdate } from '@/types';
import FixedExpenseCharts from './FixedExpenseCharts';

type Tab = '목록' | '차트';

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

const btnDanger: React.CSSProperties = {
  padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(186,26,26,0.4)',
  backgroundColor: 'transparent', color: 'rgba(186,26,26,0.9)',
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

// 카테고리에서 괄호 앞 접두어 추출: "교육비(눈높이)" → "교육비"
function groupKey(category: string): string {
  const idx = category.indexOf('(');
  return idx > 0 ? category.slice(0, idx).trim() : category.trim() || '미분류';
}

// 괄호 안 내용 추출: "교육비(눈높이)" → "눈높이", "저축" → ""
function subLabel(category: string): string {
  const m = category.match(/\(([^)]+)\)/);
  return m ? m[1] : '';
}

// ── 성향별 그룹 목록 ─────────────────────────────────────────
function GroupedList({ items, onEdit, onDelete }: { items: FixedExpense[]; onEdit: (i: FixedExpense) => void; onDelete: (i: FixedExpense) => void }) {
  const fmt = (v: number | null) => v == null ? '-' : v.toLocaleString('ko-KR') + '원';

  const groupMap = items.reduce<Record<string, FixedExpense[]>>((acc, item) => {
    const k = groupKey(item.category || '');
    (acc[k] ||= []).push(item);
    return acc;
  }, {});

  // 합계 내림차순 정렬
  const groups = Object.entries(groupMap).sort(
    ([, a], [, b]) =>
      b.reduce((s, i) => s + (i.monthly_amount ?? 0), 0) -
      a.reduce((s, i) => s + (i.monthly_amount ?? 0), 0)
  );

  if (items.length === 0) return <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>등록된 항목이 없습니다.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {groups.map(([group, list]) => {
        const total = list.reduce((s, i) => s + (i.monthly_amount ?? 0), 0);
        return (
          <div key={group} style={{ border: '1px solid var(--md-sys-light-outline-variant)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', backgroundColor: 'var(--md-sys-light-surface-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>{group}</span>
              <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>합계 {fmt(total)} / {list.length}건</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--md-sys-light-surface)' }}>
                    {['항목명', '이체명', '은행', '예금주', '계좌번호', '월금액', ''].map((h) => (
                      <th key={h} style={{ padding: '6px 10px', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'left', borderBottom: '1px solid var(--md-sys-light-outline-variant)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => {
                    const sub = subLabel(item.category);
                    const transferDisplay = [sub, item.transfer_name].filter(Boolean).join(' · ') || '-';
                    return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--md-sys-light-outline-variant)' }}>
                      <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)' }}>{item.item_name}</td>
                      <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', whiteSpace: 'nowrap' }}>{transferDisplay}</td>
                      <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{item.bank_name ?? '-'}</td>
                      <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{item.account_holder ?? '-'}</td>
                      <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{item.account_number ?? '-'}</td>
                      <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(item.monthly_amount)}</td>
                      <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={btnSecondary} onClick={() => onEdit(item)}>편집</button>
                          <button style={btnDanger} onClick={() => onDelete(item)}>삭제</button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────
type ModalMode = 'add' | 'edit' | null;

export default function FixedExpenseStatus() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('목록');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<FixedExpense | null>(null);

  const { data: fixedExpenses = [], isLoading, error } = useQuery({
    queryKey: ['fixedExpenses'],
    queryFn: getFixedExpenses,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['fixedExpenses'] });

  const createMut = useMutation({ mutationFn: createFixedExpense, onSuccess: () => { invalidate(); setModalMode(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: FixedExpenseUpdate }) => updateFixedExpense(id, data), onSuccess: () => { invalidate(); setModalMode(null); setEditTarget(null); } });
  const deleteMut = useMutation({ mutationFn: deleteFixedExpense, onSuccess: invalidate });

  const handleEdit = (item: FixedExpense) => { setEditTarget(item); setModalMode('edit'); };
  const handleDelete = (item: FixedExpense) => { if (!window.confirm(`"${item.item_name}" 항목을 삭제하시겠습니까?`)) return; deleteMut.mutate(item.id); };
  const handleClose = () => { setModalMode(null); setEditTarget(null); };

  const initialFormData: FormData = editTarget ? toFormData(editTarget) : { account_number: '', bank_name: '', account_holder: '', transfer_name: '', category: '', item_name: '', monthly_amount: '' };

  const totalMonthly = fixedExpenses.reduce((s, i) => s + (i.monthly_amount ?? 0), 0);

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

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--md-sys-light-outline-variant)', marginBottom: 'var(--md-space-md)', gap: '4px' }}>
        {(['목록', '차트'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
            {t}
            {t === '목록' && (
              <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '999px', font: 'var(--md-label-small)', backgroundColor: activeTab === '목록' ? 'var(--md-sys-light-primary)' : 'var(--md-sys-light-surface-container-high)', color: activeTab === '목록' ? 'var(--md-sys-light-on-primary)' : 'var(--md-sys-light-on-surface-variant)' }}>
                {fixedExpenses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === '목록' && (
        <GroupedList items={fixedExpenses} onEdit={handleEdit} onDelete={handleDelete} />
      )}
      {activeTab === '차트' && (
        fixedExpenses.length > 0
          ? <FixedExpenseCharts fixedExpenses={fixedExpenses} />
          : <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>데이터가 없습니다.</p>
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
          <ExpenseForm initial={initialFormData} onSubmit={(d) => updateMut.mutate({ id: editTarget.id, data: d })} onCancel={handleClose} isLoading={updateMut.isPending} submitLabel="저장" />
          {updateMut.isError && <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>오류: {(updateMut.error as Error).message}</p>}
        </Modal>
      )}
    </div>
  );
}
