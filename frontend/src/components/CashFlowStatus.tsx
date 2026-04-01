import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCashFlows, createCashFlow, updateCashFlow, deleteCashFlow } from '@/lib/api';
import type { CashFlow, CashFlowCreate } from '@/types';
import YearDetailView from './YearDetailView';
import MonthDetailView from './MonthDetailView';
import YearTabs from './YearTabs';

const EMPTY_FORM: CashFlowCreate = {
  item_name: '',
  item_type: '지출',
  total: undefined,
  monthly_average: undefined,
  monthly_data: null,
};

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--md-space-lg)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--md-sys-light-surface-container)', borderRadius: 'var(--md-radius-lg)', border: '1px solid var(--md-sys-light-outline-variant)', boxShadow: 'var(--md-shadow-medium)', width: '100%', maxWidth: '520px', padding: 'var(--md-space-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-space-md)' }}>
          <h3 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', color: 'var(--md-sys-light-on-surface-variant)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CashFlowForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CashFlow;
  onSave: (d: CashFlowCreate) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CashFlowCreate>(
    initial
      ? { item_name: initial.item_name, item_type: initial.item_type ?? '지출', total: initial.total ?? undefined, monthly_average: undefined, monthly_data: initial.monthly_data }
      : { ...EMPTY_FORM }
  );
  const monthlyAvg = form.total != null ? Math.round(form.total / 12) : null;

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

  const lbl = (t: string) => (
    <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{t}</label>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-md)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {lbl('항목명 *')}
        <input style={inputStyle} value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="예: 급여, 식비" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {lbl('유형')}
        <select style={inputStyle} value={form.item_type ?? ''} onChange={(e) => setForm({ ...form, item_type: e.target.value || null })}>
          <option value="수입">수입</option>
          <option value="지출">지출</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-space-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {lbl('총계 (원)')}
          <input type="number" style={inputStyle} value={form.total ?? ''} onChange={(e) => setForm({ ...form, total: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
            월평균 (원) <span style={{ color: 'var(--md-sys-light-primary)', fontSize: '0.85em' }}>자동계산</span>
          </label>
          <div style={{ padding: 'var(--md-space-sm) var(--md-space-md)', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', font: 'var(--md-body-medium)', background: 'var(--md-sys-light-surface-container)', color: 'var(--md-sys-light-primary)', cursor: 'default' }}>
            {monthlyAvg != null ? monthlyAvg.toLocaleString() : '—'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--md-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--md-space-sm)' }}>
        <button onClick={onCancel} style={{ padding: 'var(--md-space-sm) var(--md-space-md)', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-large)', color: 'var(--md-sys-light-on-surface-variant)' }}>취소</button>
        <button onClick={() => form.item_name.trim() && onSave({ ...form, monthly_average: monthlyAvg ?? undefined })} disabled={!form.item_name.trim()} style={{ padding: 'var(--md-space-sm) var(--md-space-md)', borderRadius: 'var(--md-radius-sm)', border: 'none', background: 'var(--md-sys-light-primary)', color: 'var(--md-sys-light-on-primary)', cursor: 'pointer', font: 'var(--md-label-large)' }}>저장</button>
      </div>
    </div>
  );
}

export default function CashFlowStatus() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CashFlow | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const { data: cashFlows = [], isLoading, error } = useQuery({
    queryKey: ['cashFlows'],
    queryFn: getCashFlows,
    refetchInterval: 30000,
  });

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    cashFlows.forEach((cf) => {
      Object.keys(cf.monthly_data ?? {}).forEach((k) => years.add(parseInt(k.slice(0, 4))));
    });
    return Array.from(years).sort();
  }, [cashFlows]);

  const effectiveYear = selectedYear ?? (availableYears.at(-1) ?? null);

  const yearFilteredCashFlows = useMemo(() => {
    if (!effectiveYear) return cashFlows;
    return cashFlows.map((cf) => ({
      ...cf,
      total: null,
      monthly_data: Object.fromEntries(
        Object.entries(cf.monthly_data ?? {}).filter(([k]) => k.startsWith(`${effectiveYear}-`))
      ),
    }));
  }, [cashFlows, effectiveYear]);

  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    yearFilteredCashFlows.forEach((cf) => {
      Object.keys(cf.monthly_data ?? {}).forEach((k) => months.add(parseInt(k.slice(5, 7))));
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [yearFilteredCashFlows]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(null);
  };

  const addMutation = useMutation({
    mutationFn: createCashFlow,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cashFlows'] }); setShowAdd(false); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CashFlowCreate }) => updateCashFlow(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cashFlows'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCashFlow,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashFlows'] }),
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

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--md-space-md)' }}>
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>현금 흐름 현황</h2>
        <button onClick={() => setShowAdd(true)} style={{ padding: 'var(--md-space-sm) var(--md-space-md)', borderRadius: 'var(--md-radius-sm)', border: 'none', background: 'var(--md-sys-light-primary)', color: 'var(--md-sys-light-on-primary)', cursor: 'pointer', font: 'var(--md-label-large)' }}>
          + 추가
        </button>
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
      {selectedMonth !== null && effectiveYear !== null ? (
        <MonthDetailView
          cashFlows={yearFilteredCashFlows}
          year={effectiveYear}
          month={selectedMonth}
          onEdit={setEditing}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      ) : effectiveYear !== null ? (
        <YearDetailView
          cashFlows={yearFilteredCashFlows}
          year={effectiveYear}
          onEdit={setEditing}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      ) : (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>데이터가 없습니다.</p>
      )}

      {/* 모달 */}
      {showAdd && (
        <Modal title="현금흐름 항목 추가" onClose={() => setShowAdd(false)}>
          <CashFlowForm onSave={(d) => addMutation.mutate(d)} onCancel={() => setShowAdd(false)} />
          {addMutation.isError && <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>오류: {(addMutation.error as Error).message}</p>}
        </Modal>
      )}
      {editing && (
        <Modal title="현금흐름 항목 편집" onClose={() => setEditing(null)}>
          <CashFlowForm initial={editing} onSave={(d) => editMutation.mutate({ id: editing.id, data: d })} onCancel={() => setEditing(null)} />
          {editMutation.isError && <p style={{ color: 'rgba(186,26,26,0.9)', font: 'var(--md-body-small)', marginTop: '8px' }}>오류: {(editMutation.error as Error).message}</p>}
        </Modal>
      )}
    </div>
  );
}
