import { useMemo } from 'react';
import type { CashFlow } from '@/types';
import { formatCurrency } from '@/utils/format';

export function SummaryCard({
  label,
  value,
  sub,
  color,
  bg,
  border,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div style={{ padding: '1rem', borderRadius: 'var(--md-radius-md)', backgroundColor: bg, border: `1px solid ${border}` }}>
      <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: '0 0 6px' }}>{label}</p>
      <p style={{ font: 'var(--md-title-medium)', color, margin: 0, fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

export function RatioBar({ incomeRatio }: { incomeRatio: number }) {
  return (
    <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--md-radius-md)', background: 'var(--md-sys-light-surface-container-low)', border: '1px solid var(--md-sys-light-outline-variant)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ font: 'var(--md-label-medium)', color: '#00C49F', fontWeight: 600 }}>
          수입 {incomeRatio.toFixed(1)}%
        </span>
        <span style={{ font: 'var(--md-label-medium)', color: '#FF8042', fontWeight: 600 }}>
          지출 {(100 - incomeRatio).toFixed(1)}%
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', background: 'rgba(255,128,66,0.2)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${incomeRatio}%`, background: '#00C49F', borderRadius: 5, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export function ItemSection({
  title,
  items,
  total,
  barColor,
  onEdit,
  onDelete,
}: {
  title: string;
  items: { cf: CashFlow; amount: number; sub?: string }[];
  total: number;
  barColor: string;
  onEdit: (item: CashFlow) => void;
  onDelete: (id: number) => void;
}) {
  const handleDelete = (id: number) => {
    if (window.confirm('삭제하시겠습니까?')) onDelete(id);
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: barColor }} />
        <h4 style={{ font: 'var(--md-label-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>{title}</h4>
        <span style={{ font: 'var(--md-label-small)', color: barColor, marginLeft: 'auto' }}>
          합계 {total.toLocaleString()}원
        </span>
      </div>
      <div>
        {items.map(({ cf, amount, sub }) => {
          const ratio = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div key={cf.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 0', borderBottom: '1px solid var(--md-sys-light-outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cf.item_name}
                  </span>
                  {sub && (
                    <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>{sub}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', minWidth: 40, textAlign: 'right' }}>
                    {ratio.toFixed(1)}%
                  </span>
                  <span style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface)', minWidth: 90, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {amount.toLocaleString()}원
                  </span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button aria-label={`${cf.item_name} 편집`} onClick={() => onEdit(cf)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--md-sys-light-outline-variant)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>편집</button>
                    <button aria-label={`${cf.item_name} 삭제`} onClick={() => handleDelete(cf.id)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(186,26,26,0.4)', background: 'transparent', cursor: 'pointer', font: 'var(--md-label-small)', color: 'rgba(186,26,26,0.9)' }}>삭제</button>
                  </div>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--md-sys-light-surface-container-high)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ratio}%`, background: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MonthDetailViewProps {
  cashFlows: CashFlow[];
  year: number;
  month: number;
  onEdit: (item: CashFlow) => void;
  onDelete: (id: number) => void;
}

export default function MonthDetailView({ cashFlows, year, month, onEdit, onDelete }: MonthDetailViewProps) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const incomeItems = useMemo(() => cashFlows
    .filter((c) => c.item_type === '수입')
    .map((c) => ({ cf: c, amount: c.monthly_data?.[monthKey] ?? 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount), [cashFlows, monthKey]);

  const expenseItems = useMemo(() => cashFlows
    .filter((c) => c.item_type === '지출')
    .map((c) => ({ cf: c, amount: c.monthly_data?.[monthKey] ?? 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount), [cashFlows, monthKey]);

  const incomeTotal = incomeItems.reduce((s, c) => s + c.amount, 0);
  const expenseTotal = expenseItems.reduce((s, c) => s + c.amount, 0);
  const netIncome = incomeTotal - expenseTotal;
  const total = incomeTotal + expenseTotal;
  const incomeBarRatio = total > 0 ? (incomeTotal / total) * 100 : 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--md-space-sm)' }}>
        <SummaryCard label="총 수입" value={formatCurrency(incomeTotal)} sub={`${incomeItems.length}개 항목`} color="#00C49F" bg="rgba(0,196,159,0.08)" border="rgba(0,196,159,0.3)" />
        <SummaryCard label="총 지출" value={formatCurrency(expenseTotal)} sub={`${expenseItems.length}개 항목`} color="#FF8042" bg="rgba(255,128,66,0.08)" border="rgba(255,128,66,0.3)" />
        <SummaryCard
          label="순수입"
          value={(netIncome >= 0 ? '+' : '-') + formatCurrency(netIncome)}
          sub={netIncome >= 0 ? '흑자' : '적자'}
          color={netIncome >= 0 ? '#8884d8' : 'rgba(186,26,26,0.9)'}
          bg={netIncome >= 0 ? 'rgba(136,132,216,0.08)' : 'rgba(186,26,26,0.05)'}
          border={netIncome >= 0 ? 'rgba(136,132,216,0.3)' : 'rgba(186,26,26,0.25)'}
        />
      </div>

      {total > 0 && <RatioBar incomeRatio={incomeBarRatio} />}

      {incomeItems.length > 0 && (
        <ItemSection title="수입 항목" items={incomeItems} total={incomeTotal} barColor="#00C49F" onEdit={onEdit} onDelete={onDelete} />
      )}
      {expenseItems.length > 0 && (
        <ItemSection title="지출 항목" items={expenseItems} total={expenseTotal} barColor="#FF8042" onEdit={onEdit} onDelete={onDelete} />
      )}
      {incomeItems.length === 0 && expenseItems.length === 0 && (
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', padding: 'var(--md-space-lg) 0' }}>이 달의 데이터가 없습니다.</p>
      )}
    </div>
  );
}
