import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/lib/api';
import type { Customer, CustomerCreate, CustomerUpdate } from '@/types';

// ── 스타일 상수 ───────────────────────────────────────────────
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

// ── FormData 타입 ─────────────────────────────────────────────
interface CustomerFormData {
  name: string;
  gender: string;
  age: string;
  credit_score: string;
  email: string;
}

const emptyFormData: CustomerFormData = { name: '', gender: '', age: '', credit_score: '', email: '' };

function toCustomerFormData(c: Customer): CustomerFormData {
  return {
    name: c.name,
    gender: c.gender ?? '',
    age: c.age != null ? String(c.age) : '',
    credit_score: c.credit_score != null ? String(c.credit_score) : '',
    email: c.email ?? '',
  };
}

function fromCustomerFormData(fd: CustomerFormData): CustomerCreate {
  return {
    name: fd.name.trim(),
    gender: fd.gender || null,
    age: fd.age.trim() !== '' ? Number(fd.age) : null,
    credit_score: fd.credit_score.trim() !== '' ? Number(fd.credit_score) : null,
    email: fd.email.trim() || null,
  };
}

// ── CustomerForm ──────────────────────────────────────────────
function CustomerForm({
  initial,
  onSave,
  onCancel,
  isLoading,
  submitLabel,
}: {
  initial: CustomerFormData;
  onSave: (data: CustomerCreate) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<CustomerFormData>(initial);

  const inputStyle: React.CSSProperties = {
    padding: 'var(--md-space-sm) var(--md-space-md)',
    borderRadius: 'var(--md-radius-sm)',
    border: '1px solid var(--md-sys-light-outline-variant)',
    font: 'var(--md-body-medium)',
    background: 'var(--md-sys-light-surface)',
    color: 'var(--md-sys-light-on-surface)',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  const field = (label: string, children: React.ReactNode, required = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
        {label}{required && <span style={{ color: 'rgba(186,26,26,0.9)' }}> *</span>}
      </label>
      {children}
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(fromCustomerFormData(form));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-md)' }}>
      {field('이름', (
        <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      ), true)}
      {field('성별', (
        <select style={inputStyle} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option value="">선택 안 함</option>
          <option value="남">남</option>
          <option value="여">여</option>
        </select>
      ))}
      {field('나이', (
        <input type="number" style={inputStyle} value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          placeholder="만 나이" min={0} />
      ))}
      {field('신용점수 (KCB)', (
        <input type="number" style={inputStyle} value={form.credit_score}
          onChange={(e) => setForm({ ...form, credit_score: e.target.value })}
          placeholder="신용점수" min={0} max={1000} />
      ))}
      {field('이메일', (
        <input type="email" style={inputStyle} value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="이메일" />
      ))}
      <div style={{ display: 'flex', gap: 'var(--md-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--md-space-sm)' }}>
        <button type="button" style={btnSecondary} onClick={onCancel} disabled={isLoading}>취소</button>
        <button type="submit" style={btnPrimary} disabled={isLoading}>{isLoading ? '저장 중...' : submitLabel}</button>
      </div>
    </form>
  );
}

// ── Modal ─────────────────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--md-space-lg)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--md-sys-light-surface-container)', borderRadius: 'var(--md-radius-lg)', border: '1px solid var(--md-sys-light-outline-variant)', boxShadow: 'var(--md-shadow-medium)', width: '100%', maxWidth: '480px', padding: 'var(--md-space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-space-md)' }}>
          <h3 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', color: 'var(--md-sys-light-on-surface-variant)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────
type ModalMode = 'add' | 'edit' | null;

export default function CustomerInfo() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);

  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
    refetchInterval: 30000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['customers'] });

  const createMut = useMutation({
    mutationFn: (data: CustomerCreate) => createCustomer(data),
    onSuccess: () => { invalidate(); setModalMode(null); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerUpdate }) => updateCustomer(id, data),
    onSuccess: () => { invalidate(); setModalMode(null); setEditTarget(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: invalidate,
  });

  const handleEdit = (customer: Customer) => { setEditTarget(customer); setModalMode('edit'); };
  const handleDelete = (customer: Customer) => {
    if (!window.confirm(`"${customer.name}" 고객을 삭제하시겠습니까?`)) return;
    deleteMut.mutate(customer.id);
  };
  const handleClose = () => { setModalMode(null); setEditTarget(null); };

  const initialFormData: CustomerFormData = editTarget ? toCustomerFormData(editTarget) : emptyFormData;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--md-sys-light-surface-container)',
    borderRadius: 'var(--md-radius-lg)',
    border: '1px solid var(--md-sys-light-outline-variant)',
    padding: 'var(--md-space-lg)',
    boxShadow: 'var(--md-shadow-soft)',
  };

  if (isLoading) return <div style={cardStyle}><p>로딩 중...</p></div>;
  if (error) return <div style={cardStyle}><p style={{ color: 'rgba(186,26,26,0.9)' }}>오류가 발생했습니다.</p></div>;

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-space-md)' }}>
        <div>
          <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: '0 0 4px' }}>
            고객 정보
          </h2>
          <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: 0 }}>
            {customers.length}명 등록됨
          </p>
        </div>
        <button style={btnPrimary} onClick={() => { setEditTarget(null); setModalMode('add'); }}>+ 추가</button>
      </div>

      {customers.length === 0 ? (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          등록된 고객정보가 없습니다.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-md)' }}>
          {customers.map((customer) => (
            <div key={customer.id} style={{ border: '1px solid var(--md-sys-light-outline-variant)', borderRadius: 'var(--md-radius-lg)', padding: 'var(--md-space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-md)', marginBottom: 'var(--md-space-sm)' }}>
                    <h3 style={{ font: 'var(--md-body-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
                      {customer.name}
                    </h3>
                    {customer.gender && (
                      <span style={{ padding: '2px 8px', font: 'var(--md-label-small)', backgroundColor: 'var(--md-sys-light-secondary-container)', color: 'var(--md-sys-light-on-secondary-container)', borderRadius: 'var(--md-radius-sm)' }}>
                        {customer.gender}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--md-space-lg)', font: 'var(--md-body-medium)', flexWrap: 'wrap' }}>
                    {customer.age != null && <span><span style={{ color: 'var(--md-sys-light-on-surface-variant)' }}>나이: </span>{customer.age}세</span>}
                    {customer.credit_score != null && <span><span style={{ color: 'var(--md-sys-light-on-surface-variant)' }}>신용점수: </span>{customer.credit_score.toLocaleString()}</span>}
                    {customer.email && <span><span style={{ color: 'var(--md-sys-light-on-surface-variant)' }}>이메일: </span>{customer.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginLeft: 'var(--md-space-md)', flexShrink: 0 }}>
                  <button
                    style={btnSecondary}
                    onClick={() => handleEdit(customer)}
                  >
                    편집
                  </button>
                  <button
                    style={btnDanger}
                    onClick={() => handleDelete(customer)}
                    disabled={deleteMut.isPending}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 모달 */}
      {modalMode === 'add' && (
        <Modal title="고객 추가" onClose={handleClose}>
          <CustomerForm
            initial={initialFormData}
            onSave={(data) => createMut.mutate(data)}
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
        <Modal title="정보 편집" onClose={handleClose}>
          <CustomerForm
            key={editTarget.id}
            initial={initialFormData}
            onSave={(data) => editMutation.mutate({ id: editTarget.id, data })}
            onCancel={handleClose}
            isLoading={editMutation.isPending}
            submitLabel="저장"
          />
          {editMutation.isError && (
            <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>
              오류: {(editMutation.error as Error).message}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
