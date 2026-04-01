import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCashFlows, createCashFlow, updateCashFlow, deleteCashFlow } from '@/lib/api';
import type { CashFlow, CashFlowCreate } from '@/types';
import CashFlowCharts from './CashFlowCharts';
import YearTabs from './YearTabs';

type Tab = '수입' | '지출' | '차트';

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

function itemEffectiveTotal(c: CashFlow): number {
  if (c.total && c.total > 0) return c.total;
  if (c.monthly_data) return Object.values(c.monthly_data as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
  return 0;
}

function ItemTable({
  items,
  onEdit,
  onDelete,
}: {
  items: CashFlow[];
  onEdit: (item: CashFlow) => void;
  onDelete: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>
        등록된 항목이 없습니다.
      </p>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--md-sys-light-surface-container-high)' }}>
            {['항목명', '총계', '월평균', ''].map((h) => (
              <th key={h} style={{ padding: '8px 12px', textAlign: h === '총계' || h === '월평균' ? 'right' : 'left', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', borderBottom: '1px solid var(--md-sys-light-outline-variant)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid var(--md-sys-light-outline-variant)' }}>
              <td style={{ padding: '8px 12px', font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface)' }}>{item.item_name}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface)' }}>
                {itemEffectiveTotal(item) > 0 ? itemEffectiveTotal(item).toLocaleString() : '-'}
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right', font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface)' }}>
                {(() => {
                  const t = itemEffectiveTotal(item);
                  const months = item.monthly_data ? Object.keys(item.monthly_data).length : 0;
                  return t > 0 && months > 0 ? Math.round(t / months).toLocaleString() : '-';
                })()}
              </td>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <button onClick={() => onEdit(item)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--md-sys-light-outline-variant)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>편집</button>
                  <button onClick={() => window.confirm('삭제하시겠습니까?') && onDelete(item.id)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(186,26,26,0.4)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-small)', color: 'rgba(186,26,26,0.9)' }}>삭제</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CashFlowStatus() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('수입');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CashFlow | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { data: cashFlows = [], isLoading, error } = useQuery({
    queryKey: ['cashFlows'],
    queryFn: getCashFlows,
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
      monthly_data: Object.fromEntries(
        Object.entries(cf.monthly_data ?? {}).filter(([k]) => k.startsWith(`${effectiveYear}-`))
      ),
    }));
  }, [cashFlows, effectiveYear]);

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

  const itemTotal = (c: CashFlow): number => {
    if (c.total && c.total > 0) return c.total;
    if (c.monthly_data) return Object.values(c.monthly_data as Record<string, number>).reduce((s, v) => s + (v || 0), 0);
    return 0;
  };

  const incomeItems = yearFilteredCashFlows.filter((c) => c.item_type === '수입');
  const expenseItems = yearFilteredCashFlows.filter((c) => c.item_type === '지출');
  const incomeTotal = incomeItems.reduce((s, c) => s + itemTotal(c), 0);
  const expenseTotal = expenseItems.reduce((s, c) => s + itemTotal(c), 0);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: '수입', label: '수입', count: incomeItems.length },
    { key: '지출', label: '지출', count: expenseItems.length },
    { key: '차트', label: '차트' },
  ];

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

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--md-space-md)' }}>
        <h2 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
          현금 흐름 현황
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: 'var(--md-space-sm) var(--md-space-md)', borderRadius: 'var(--md-radius-sm)', border: 'none', background: 'var(--md-sys-light-primary)', color: 'var(--md-sys-light-on-primary)', cursor: 'pointer', font: 'var(--md-label-large)' }}
        >
          + 추가
        </button>
      </div>

      {/* 연도 탭 */}
      {availableYears.length > 0 && effectiveYear != null && (
        <YearTabs years={availableYears} selected={effectiveYear} onChange={setSelectedYear} />
      )}

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-space-md)', marginBottom: 'var(--md-space-md)' }}>
        <div style={{ padding: 'var(--md-space-md)', borderRadius: 'var(--md-radius-md)', backgroundColor: 'rgba(0,196,159,0.08)', border: '1px solid rgba(0,196,159,0.25)' }}>
          <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: '0 0 4px' }}>총 수입</p>
          <p style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>{incomeTotal.toLocaleString()}원</p>
        </div>
        <div style={{ padding: 'var(--md-space-md)', borderRadius: 'var(--md-radius-md)', backgroundColor: 'rgba(255,128,66,0.08)', border: '1px solid rgba(255,128,66,0.25)' }}>
          <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: '0 0 4px' }}>총 지출</p>
          <p style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>{expenseTotal.toLocaleString()}원</p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--md-sys-light-outline-variant)', marginBottom: 'var(--md-space-md)', gap: '4px' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabStyle(t.key)}>
            {t.label}
            {t.count !== undefined && (
              <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '999px', font: 'var(--md-label-small)', backgroundColor: activeTab === t.key ? 'var(--md-sys-light-primary)' : 'var(--md-sys-light-surface-container-high)', color: activeTab === t.key ? 'var(--md-sys-light-on-primary)' : 'var(--md-sys-light-on-surface-variant)' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === '수입' && (
        <ItemTable items={incomeItems} onEdit={setEditing} onDelete={(id) => deleteMutation.mutate(id)} />
      )}
      {activeTab === '지출' && (
        <ItemTable items={expenseItems} onEdit={setEditing} onDelete={(id) => deleteMutation.mutate(id)} />
      )}
      {activeTab === '차트' && (
        yearFilteredCashFlows.length > 0
          ? <CashFlowCharts cashFlows={yearFilteredCashFlows} />
          : <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>데이터가 없습니다.</p>
      )}

      {/* 모달 */}
      {showAdd && (
        <Modal title="현금흐름 항목 추가" onClose={() => setShowAdd(false)}>
          <CashFlowForm onSave={(d) => addMutation.mutate(d)} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="현금흐름 항목 편집" onClose={() => setEditing(null)}>
          <CashFlowForm initial={editing} onSave={(d) => editMutation.mutate({ id: editing.id, data: d })} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
