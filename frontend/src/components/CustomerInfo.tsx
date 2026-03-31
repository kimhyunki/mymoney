import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, updateCustomer } from '@/lib/api';
import type { Customer, CustomerUpdate } from '@/types';

function CustomerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Customer;
  onSave: (data: CustomerUpdate) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CustomerUpdate>({
    name: initial.name,
    gender: initial.gender ?? '',
    age: initial.age ?? undefined,
    credit_score: initial.credit_score ?? undefined,
    email: initial.email ?? '',
  });

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

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-md)' }}>
      {field('이름', (
        <input style={inputStyle} value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      ))}
      {field('성별', (
        <select style={inputStyle} value={form.gender ?? ''} onChange={(e) => setForm({ ...form, gender: e.target.value || null })}>
          <option value="">선택 안 함</option>
          <option value="남">남</option>
          <option value="여">여</option>
        </select>
      ))}
      {field('나이', (
        <input type="number" style={inputStyle} value={form.age ?? ''}
          onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="만 나이" min={0} />
      ))}
      {field('신용점수 (KCB)', (
        <input type="number" style={inputStyle} value={form.credit_score ?? ''}
          onChange={(e) => setForm({ ...form, credit_score: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="신용점수" min={0} max={1000} />
      ))}
      {field('이메일', (
        <input type="email" style={inputStyle} value={form.email ?? ''}
          onChange={(e) => setForm({ ...form, email: e.target.value || null })} placeholder="이메일" />
      ))}
      <div style={{ display: 'flex', gap: 'var(--md-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--md-space-sm)' }}>
        <button onClick={onCancel} style={{ padding: 'var(--md-space-sm) var(--md-space-md)', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-large)', color: 'var(--md-sys-light-on-surface-variant)' }}>
          취소
        </button>
        <button onClick={() => onSave(form)} style={{ padding: 'var(--md-space-sm) var(--md-space-md)', borderRadius: 'var(--md-radius-sm)', border: 'none', background: 'var(--md-sys-light-primary)', color: 'var(--md-sys-light-on-primary)', cursor: 'pointer', font: 'var(--md-label-large)' }}>
          저장
        </button>
      </div>
    </div>
  );
}

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

export default function CustomerInfo() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Customer | null>(null);

  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerUpdate }) => updateCustomer(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setEditing(null); },
  });

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
      <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)', marginTop: 0 }}>
        고객 정보
      </h2>

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
                <button
                  onClick={() => setEditing(customer)}
                  style={{ padding: '4px 12px', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', marginLeft: 'var(--md-space-md)' }}
                >
                  편집
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title="정보 편집" onClose={() => setEditing(null)}>
          <CustomerForm
            initial={editing}
            onSave={(data) => editMutation.mutate({ id: editing.id, data })}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
