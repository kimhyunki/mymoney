import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
} from '@/lib/api';
import type { FixedExpense, FixedExpenseCreate, FixedExpenseUpdate } from '@/types';
import FixedExpenseCharts from './FixedExpenseCharts';

// ── 스타일 ────────────────────────────────────────────────────
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

const btnPrimary: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: 'var(--md-sys-light-primary)',
  color: 'var(--md-sys-light-on-primary)',
  font: 'var(--md-label-medium)',
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid var(--md-sys-light-outline-variant)',
  backgroundColor: 'var(--md-sys-light-surface)',
  color: 'var(--md-sys-light-on-surface)',
  font: 'var(--md-label-small)',
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(186,26,26,0.4)',
  backgroundColor: 'transparent',
  color: 'rgba(186,26,26,0.9)',
  font: 'var(--md-label-small)',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid var(--md-sys-light-outline-variant)',
  backgroundColor: 'var(--md-sys-light-surface)',
  color: 'var(--md-sys-light-on-surface)',
  font: 'var(--md-body-small)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  font: 'var(--md-label-small)',
  color: 'var(--md-sys-light-on-surface-variant)',
  marginBottom: '4px',
  display: 'block',
};

// ── 인라인 Modal ──────────────────────────────────────────────
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: '24px',
          width: '480px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--md-sys-light-on-surface-variant)' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── FixedExpense 폼 ───────────────────────────────────────────
interface FormData {
  account_number: string;
  bank_name: string;
  account_holder: string;
  transfer_name: string;
  category: string;
  item_name: string;
  monthly_amount: string;
}

function toFormData(fe: FixedExpense): FormData {
  return {
    account_number: fe.account_number ?? '',
    bank_name: fe.bank_name ?? '',
    account_holder: fe.account_holder ?? '',
    transfer_name: fe.transfer_name ?? '',
    category: fe.category,
    item_name: fe.item_name,
    monthly_amount: fe.monthly_amount != null ? String(fe.monthly_amount) : '',
  };
}

function fromFormData(fd: FormData): FixedExpenseCreate {
  const amount = fd.monthly_amount.trim() !== '' ? Number(fd.monthly_amount) : null;
  return {
    account_number: fd.account_number.trim() || null,
    bank_name: fd.bank_name.trim() || null,
    account_holder: fd.account_holder.trim() || null,
    transfer_name: fd.transfer_name.trim() || null,
    category: fd.category.trim(),
    item_name: fd.item_name.trim(),
    monthly_amount: isNaN(amount as number) ? null : amount,
  };
}

interface ExpenseFormProps {
  initial: FormData;
  onSubmit: (data: FixedExpenseCreate) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}

function ExpenseForm({ initial, onSubmit, onCancel, isLoading, submitLabel }: ExpenseFormProps) {
  const [fd, setFd] = useState<FormData>(initial);

  const handle = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFd((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fd.category.trim() || !fd.item_name.trim()) return;
    onSubmit(fromFormData(fd));
  };

  const fieldRow = (label: string, field: keyof FormData, required = false) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: 'rgba(186,26,26,0.9)' }}> *</span>}
      </label>
      <input
        style={inputStyle}
        value={fd[field]}
        onChange={handle(field)}
        required={required}
        type={field === 'monthly_amount' ? 'number' : 'text'}
        placeholder={field === 'monthly_amount' ? '0' : ''}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
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
        <button type="button" style={btnSecondary} onClick={onCancel} disabled={isLoading}>
          취소
        </button>
        <button type="submit" style={btnPrimary} disabled={isLoading}>
          {isLoading ? '저장 중...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ── 성향별 그룹 목록 ─────────────────────────────────────────
function formatAmount(amount: number | null): string {
  if (amount == null) return '-';
  return amount.toLocaleString('ko-KR') + '원';
}

interface GroupedListProps {
  items: FixedExpense[];
  onEdit: (item: FixedExpense) => void;
  onDelete: (item: FixedExpense) => void;
}

function GroupedList({ items, onEdit, onDelete }: GroupedListProps) {
  const groups = items.reduce<Record<string, FixedExpense[]>>((acc, item) => {
    const key = item.category || '미분류';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Object.entries(groups).map(([category, list]) => {
        const total = list.reduce((sum, i) => sum + (i.monthly_amount ?? 0), 0);
        return (
          <div
            key={category}
            style={{
              border: '1px solid var(--md-sys-light-outline-variant)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 14px',
                backgroundColor: 'var(--md-sys-light-surface-variant)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                {category}
              </span>
              <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                합계 {formatAmount(total)} / {list.length}건
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--md-sys-light-surface)' }}>
                  {['항목명', '이체명', '은행', '예금주', '계좌번호', '월금액', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '6px 10px',
                        font: 'var(--md-label-small)',
                        color: 'var(--md-sys-light-on-surface-variant)',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--md-sys-light-outline-variant)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--md-sys-light-outline-variant)' }}
                  >
                    <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)' }}>
                      {item.item_name}
                    </td>
                    <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                      {item.transfer_name ?? '-'}
                    </td>
                    <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                      {item.bank_name ?? '-'}
                    </td>
                    <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                      {item.account_holder ?? '-'}
                    </td>
                    <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                      {item.account_number ?? '-'}
                    </td>
                    <td style={{ padding: '6px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {formatAmount(item.monthly_amount)}
                    </td>
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={btnSecondary} onClick={() => onEdit(item)}>편집</button>
                        <button style={btnDanger} onClick={() => onDelete(item)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
type ModalMode = 'add' | 'edit' | null;

function FixedExpenseStatus() {
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<FixedExpense | null>(null);

  const { data: fixedExpenses = [], isLoading, error } = useQuery({
    queryKey: ['fixedExpenses'],
    queryFn: () => getFixedExpenses(),
    refetchInterval: 30000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['fixedExpenses'] });

  const createMut = useMutation({
    mutationFn: (data: FixedExpenseCreate) => createFixedExpense(data),
    onSuccess: () => { invalidate(); setModalMode(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FixedExpenseUpdate }) =>
      updateFixedExpense(id, data),
    onSuccess: () => { invalidate(); setModalMode(null); setEditTarget(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteFixedExpense(id),
    onSuccess: () => invalidate(),
  });

  const handleAdd = () => {
    setEditTarget(null);
    setModalMode('add');
  };

  const handleEdit = (item: FixedExpense) => {
    setEditTarget(item);
    setModalMode('edit');
  };

  const handleDelete = (item: FixedExpense) => {
    if (!window.confirm(`"${item.item_name}" 항목을 삭제하시겠습니까?`)) return;
    deleteMut.mutate(item.id);
  };

  const handleClose = () => {
    setModalMode(null);
    setEditTarget(null);
  };

  const initialFormData: FormData = editTarget
    ? toFormData(editTarget)
    : {
        account_number: '',
        bank_name: '',
        account_holder: '',
        transfer_name: '',
        category: '',
        item_name: '',
        monthly_amount: '',
      };

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-space-md)' }}>
        <h2 style={{ ...titleStyle, marginBottom: 0 }}>고정비 현황</h2>
        <button style={btnPrimary} onClick={handleAdd}>+ 추가</button>
      </div>

      {/* 상태별 콘텐츠 */}
      {isLoading && (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>로딩 중...</p>
      )}

      {error && (
        <p style={{ font: 'var(--md-body-medium)', color: 'rgba(186, 26, 26, 0.9)' }}>
          고정비 현황을 불러오는 중 오류가 발생했습니다.
        </p>
      )}

      {!isLoading && !error && fixedExpenses.length === 0 && (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          등록된 고정비 데이터가 없습니다. 추가 버튼을 눌러 직접 입력하거나 Excel 파일을 업로드하세요.
        </p>
      )}

      {!isLoading && !error && fixedExpenses.length > 0 && (
        <>
          <FixedExpenseCharts fixedExpenses={fixedExpenses} />
          <div style={{ marginTop: 'var(--md-space-md)', paddingTop: 'var(--md-space-md)', borderTop: '1px solid var(--md-sys-light-outline-variant)' }}>
            <GroupedList
              items={fixedExpenses}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}

      {/* 데이터가 없어도 목록(빈 상태)일 때도 삭제 버튼은 필요 없으므로 생략 */}

      <div style={{ marginTop: 'var(--md-space-md)', paddingTop: 'var(--md-space-md)', borderTop: '1px solid var(--md-sys-light-outline-variant)' }}>
        <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'center', margin: 0 }}>
          고정비 현황은 30초마다 자동으로 업데이트됩니다.
        </p>
      </div>

      {/* 추가 모달 */}
      {modalMode === 'add' && (
        <Modal title="고정비 추가" onClose={handleClose}>
          <ExpenseForm
            initial={initialFormData}
            onSubmit={(data) => createMut.mutate(data)}
            onCancel={handleClose}
            isLoading={createMut.isPending}
            submitLabel="추가"
          />
          {createMut.isError && (
            <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>
              오류: {(createMut.error as Error).message}
            </p>
          )}
        </Modal>
      )}

      {/* 편집 모달 */}
      {modalMode === 'edit' && editTarget && (
        <Modal title="고정비 편집" onClose={handleClose}>
          <ExpenseForm
            initial={initialFormData}
            onSubmit={(data) => updateMut.mutate({ id: editTarget.id, data })}
            onCancel={handleClose}
            isLoading={updateMut.isPending}
            submitLabel="저장"
          />
          {updateMut.isError && (
            <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>
              오류: {(updateMut.error as Error).message}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

export default FixedExpenseStatus;
