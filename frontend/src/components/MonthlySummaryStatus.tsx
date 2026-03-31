import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMonthlySummaries,
  createMonthlySummary,
  updateMonthlySummary,
  deleteMonthlySummary,
} from '@/lib/api';
import type { MonthlySummary, MonthlySummaryCreate, MonthlySummaryUpdate } from '@/types';
import MonthlySummaryCharts from './MonthlySummaryCharts';

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

const thStyle: React.CSSProperties = {
  padding: '8px 10px', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)',
  textAlign: 'left', borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  whiteSpace: 'nowrap', backgroundColor: 'var(--md-sys-light-surface)',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 10px', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)', whiteSpace: 'nowrap',
};

// ── Modal ────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: 'var(--md-sys-light-surface-container)', borderRadius: 'var(--md-radius-lg)', border: '1px solid var(--md-sys-light-outline-variant)', padding: '24px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--md-sys-light-on-surface-variant)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── 폼 타입 ───────────────────────────────────────────────────
interface FormData {
  year: string; month: string; income: string; expense: string;
  net_income: string; cumulative_net_income: string;
  investment_principal: string; investment_value: string;
}

const emptyFormData = (): FormData => ({
  year: String(new Date().getFullYear()), month: String(new Date().getMonth() + 1),
  income: '', expense: '', net_income: '', cumulative_net_income: '',
  investment_principal: '', investment_value: '',
});

function toFormData(s: MonthlySummary): FormData {
  return {
    year: String(s.year), month: String(s.month),
    income: s.income != null ? String(s.income) : '',
    expense: s.expense != null ? String(s.expense) : '',
    net_income: s.net_income != null ? String(s.net_income) : '',
    cumulative_net_income: s.cumulative_net_income != null ? String(s.cumulative_net_income) : '',
    investment_principal: s.investment_principal != null ? String(s.investment_principal) : '',
    investment_value: s.investment_value != null ? String(s.investment_value) : '',
  };
}

function parseNum(val: string): number | null {
  const t = val.trim(); if (t === '') return null;
  const n = Number(t); return isNaN(n) ? null : n;
}

function fromFormData(fd: FormData): MonthlySummaryCreate {
  return {
    year: Number(fd.year), month: Number(fd.month),
    income: parseNum(fd.income), expense: parseNum(fd.expense),
    net_income: parseNum(fd.net_income), cumulative_net_income: parseNum(fd.cumulative_net_income),
    investment_principal: parseNum(fd.investment_principal), investment_value: parseNum(fd.investment_value),
  };
}

// ── 폼 컴포넌트 ───────────────────────────────────────────────
function SummaryForm({ initial, onSubmit, onCancel, isLoading, submitLabel }: {
  initial: FormData; onSubmit: (data: MonthlySummaryCreate) => void;
  onCancel: () => void; isLoading: boolean; submitLabel: string;
}) {
  const [fd, setFd] = useState<FormData>(initial);
  const handle = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFd((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = Number(fd.year), m = Number(fd.month);
    if (!y || !m || m < 1 || m > 12) return;
    onSubmit(fromFormData(fd));
  };

  const nf = (label: string, field: keyof FormData, required = false) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: 'rgba(186,26,26,0.9)' }}> *</span>}</label>
      <input style={inputStyle} type="number" value={fd[field]} onChange={handle(field)} required={required} placeholder="0" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div>{nf('연도', 'year', true)}</div>
        <div>{nf('월', 'month', true)}</div>
        <div>{nf('수입 (원)', 'income')}</div>
        <div>{nf('지출 (원)', 'expense')}</div>
        <div>{nf('순수익 (원)', 'net_income')}</div>
        <div>{nf('누적순수익 (원)', 'cumulative_net_income')}</div>
        <div>{nf('투자원금 (원)', 'investment_principal')}</div>
        <div>{nf('평가금 (원)', 'investment_value')}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" style={btnSecondary} onClick={onCancel} disabled={isLoading}>취소</button>
        <button type="submit" style={btnPrimary} disabled={isLoading}>{isLoading ? '저장 중...' : submitLabel}</button>
      </div>
    </form>
  );
}

// ── 유틸 ─────────────────────────────────────────────────────
function formatAmt(val: number | null): string {
  if (val == null) return '-';
  return val.toLocaleString('ko-KR');
}

function padMonth(m: number): string {
  return String(m).padStart(2, '0');
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
type ModalMode = 'add' | 'edit' | null;

function MonthlySummaryStatus() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('목록');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<MonthlySummary | null>(null);

  const { data: summaries = [], isLoading, error } = useQuery({
    queryKey: ['monthlySummaries'],
    queryFn: () => getMonthlySummaries(),
    refetchInterval: 30000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['monthlySummaries'] });

  const createMut = useMutation({
    mutationFn: (data: MonthlySummaryCreate) => createMonthlySummary(data),
    onSuccess: () => { invalidate(); setModalMode(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MonthlySummaryUpdate }) => updateMonthlySummary(id, data),
    onSuccess: () => { invalidate(); setModalMode(null); setEditTarget(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMonthlySummary(id),
    onSuccess: () => invalidate(),
  });

  const handleEdit = (item: MonthlySummary) => { setEditTarget(item); setModalMode('edit'); };
  const handleDelete = (item: MonthlySummary) => {
    if (!window.confirm(`${item.year}년 ${padMonth(item.month)}월 결산을 삭제하시겠습니까?`)) return;
    deleteMut.mutate(item.id);
  };
  const handleClose = () => { setModalMode(null); setEditTarget(null); };

  const sorted = [...summaries].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  const initialFormData: FormData = editTarget ? toFormData(editTarget) : emptyFormData();

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
          <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: '0 0 4px' }}>월별 결산</h2>
          <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: 0 }}>
            {summaries.length}건
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
                {summaries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === '목록' && (
        summaries.length === 0 ? (
          <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>
            등록된 월별 결산 데이터가 없습니다.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr>
                  {['연도', '월', '수입', '지출', '순수익', '누적순수익', '투자원금', '평가금', ''].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.id}>
                    <td style={tdStyle}>{s.year}</td>
                    <td style={tdStyle}>{padMonth(s.month)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmt(s.income)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmt(s.expense)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: s.net_income != null && s.net_income < 0 ? 'rgba(186,26,26,0.9)' : 'var(--md-sys-light-on-surface)' }}>
                      {formatAmt(s.net_income)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmt(s.cumulative_net_income)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmt(s.investment_principal)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmt(s.investment_value)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={btnSecondary} onClick={() => handleEdit(s)}>편집</button>
                        <button style={btnDanger} onClick={() => handleDelete(s)}>삭제</button>
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
        summaries.length > 0
          ? <MonthlySummaryCharts summaries={summaries} />
          : <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>데이터가 없습니다.</p>
      )}

      {/* 모달 */}
      {modalMode === 'add' && (
        <Modal title="월별 결산 추가" onClose={handleClose}>
          <SummaryForm initial={initialFormData} onSubmit={(data) => createMut.mutate(data)} onCancel={handleClose} isLoading={createMut.isPending} submitLabel="추가" />
          {createMut.isError && <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>오류: {(createMut.error as Error).message}</p>}
        </Modal>
      )}
      {modalMode === 'edit' && editTarget && (
        <Modal title="월별 결산 편집" onClose={handleClose}>
          <SummaryForm initial={initialFormData} onSubmit={(data) => updateMut.mutate({ id: editTarget.id, data })} onCancel={handleClose} isLoading={updateMut.isPending} submitLabel="저장" />
          {updateMut.isError && <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>오류: {(updateMut.error as Error).message}</p>}
        </Modal>
      )}
    </div>
  );
}

export default MonthlySummaryStatus;
