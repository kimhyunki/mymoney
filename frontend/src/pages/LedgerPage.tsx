import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  getLedgerTransactions,
  createLedgerTransaction,
  updateLedgerTransaction,
  deleteLedgerTransaction,
  uploadLedgerExcel,
} from '@/lib/api';
import type { LedgerTransaction, LedgerTransactionCreate } from '@/types';
import YearTabs from '@/components/YearTabs';

type Tab = '목록' | '카테고리' | '월별';
type TypeFilter = '전체' | '지출' | '수입' | '이체';

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: 'var(--md-space-lg)',
  boxShadow: 'var(--md-shadow-soft)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 10px',
  borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)',
  backgroundColor: 'var(--md-sys-light-surface)', whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 10px', borderBottom: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  borderRadius: 'var(--md-radius-sm)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  font: 'var(--md-body-medium)',
  backgroundColor: 'var(--md-sys-light-surface-container-high)',
  color: 'var(--md-sys-light-on-surface)',
  outline: 'none',
  boxSizing: 'border-box',
};

const CHART_COLORS = [
  '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D00',
  '#AA00FF', '#00BCD4', '#8BC34A', '#F06292', '#26A69A',
  '#7E57C2', '#42A5F5', '#D4E157', '#EC407A', '#29B6F6',
];

function fmt(n: number | null | undefined): string {
  if (n == null) return '-';
  return Math.abs(n).toLocaleString('ko-KR', { maximumFractionDigits: 0 });
}

function fmtDate(d: string | null): string {
  if (!d) return '-';
  return d.slice(0, 10);
}

function amountColor(type: string | null): string {
  if (type === '수입') return '#1a7f37';
  if (type === '지출') return '#ba1a1a';
  return 'var(--md-sys-light-on-surface-variant)';
}

function amountPrefix(type: string | null): string {
  if (type === '수입') return '+';
  if (type === '지출') return '-';
  return '';
}

interface TxForm {
  transaction_date: string;
  transaction_time: string;
  transaction_type: string;
  category: string;
  subcategory: string;
  description: string;
  amount: string;
  currency: string;
  payment_method: string;
  memo: string;
}

const emptyForm: TxForm = {
  transaction_date: '',
  transaction_time: '',
  transaction_type: '지출',
  category: '',
  subcategory: '',
  description: '',
  amount: '',
  currency: 'KRW',
  payment_method: '',
  memo: '',
};

function formToPayload(form: TxForm): LedgerTransactionCreate {
  return {
    transaction_date: form.transaction_date || undefined,
    transaction_time: form.transaction_time || undefined,
    transaction_type: form.transaction_type || undefined,
    category: form.category || undefined,
    subcategory: form.subcategory || undefined,
    description: form.description || undefined,
    amount: form.amount ? parseFloat(form.amount) : undefined,
    currency: form.currency || 'KRW',
    payment_method: form.payment_method || undefined,
    memo: form.memo || undefined,
  };
}

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('목록');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('전체');
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [searchText, setSearchText] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LedgerTransaction | null>(null);
  const [form, setForm] = useState<TxForm>(emptyForm);
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const queryClient = useQueryClient();

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['ledger-transactions'],
    queryFn: () => getLedgerTransactions(),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: LedgerTransactionCreate) => createLedgerTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LedgerTransactionCreate }) =>
      updateLedgerTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLedgerTransaction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] }),
  });

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';  // 같은 파일 재선택 허용
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await uploadLedgerExcel(file);
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['ledger-transactions'] });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Excel 업로드 실패');
    } finally {
      setIsImporting(false);
    }
  }

  function openAdd() {
    setEditTarget(null);
    setForm({ ...emptyForm, transaction_date: new Date().toISOString().slice(0, 10) });
    setIsModalOpen(true);
  }

  function openEdit(item: LedgerTransaction) {
    setEditTarget(item);
    setForm({
      transaction_date: item.transaction_date?.slice(0, 10) ?? '',
      transaction_time: item.transaction_time ?? '',
      transaction_type: item.transaction_type ?? '지출',
      category: item.category ?? '',
      subcategory: item.subcategory ?? '',
      description: item.description ?? '',
      amount: item.amount != null ? String(Math.abs(item.amount)) : '',
      currency: item.currency ?? 'KRW',
      payment_method: item.payment_method ?? '',
      memo: item.memo ?? '',
    });
    setIsModalOpen(true);
  }

  function handleDelete(item: LedgerTransaction) {
    if (!confirm(`"${item.description ?? item.category}" 거래를 삭제하시겠습니까?`)) return;
    deleteMutation.mutate(item.id);
  }

  function handleSubmit() {
    const payload = formToPayload(form);
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allItems.forEach((i) => {
      if (i.transaction_date) years.add(parseInt(i.transaction_date.slice(0, 4)));
    });
    return Array.from(years).sort();
  }, [allItems]);

  const effectiveYear = selectedYear ?? (availableYears.at(-1) ?? null);

  const yearFiltered = useMemo(() => {
    if (!effectiveYear) return allItems;
    return allItems.filter((i) => i.transaction_date?.startsWith(String(effectiveYear)));
  }, [allItems, effectiveYear]);

  const categories = useMemo(() => {
    const cats = new Set(yearFiltered.map(i => i.category).filter(Boolean) as string[]);
    return ['전체', ...Array.from(cats).sort()];
  }, [yearFiltered]);

  const filtered = useMemo(() => {
    return yearFiltered.filter(item => {
      if (typeFilter !== '전체' && item.transaction_type !== typeFilter) return false;
      if (categoryFilter !== '전체' && item.category !== categoryFilter) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          item.description?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.subcategory?.toLowerCase().includes(q) ||
          item.payment_method?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [yearFiltered, typeFilter, categoryFilter, searchText]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    yearFiltered.filter(i => i.transaction_type === '지출').forEach(i => {
      const cat = i.category ?? '미분류';
      map[cat] = (map[cat] ?? 0) + Math.abs(i.amount ?? 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [yearFiltered]);

  const monthlyStats = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    yearFiltered.forEach(i => {
      if (!i.transaction_date) return;
      const month = i.transaction_date.slice(0, 7);
      if (!map[month]) map[month] = { income: 0, expense: 0 };
      if (i.transaction_type === '수입') map[month].income += Math.abs(i.amount ?? 0);
      if (i.transaction_type === '지출') map[month].expense += Math.abs(i.amount ?? 0);
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, ...v, net: v.income - v.expense }));
  }, [yearFiltered]);

  const totalIncome = yearFiltered.filter(i => i.transaction_type === '수입').reduce((s, i) => s + Math.abs(i.amount ?? 0), 0);
  const totalExpense = yearFiltered.filter(i => i.transaction_type === '지출').reduce((s, i) => s + Math.abs(i.amount ?? 0), 0);

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
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--md-space-sm)' }}>
        <div>
          <h1 style={{ font: 'var(--md-title-large)', color: 'var(--md-sys-light-on-surface)', margin: 0 }}>
            가계부 내역
          </h1>
          <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-xs)', marginBottom: 0 }}>
            수입·지출·이체 거래 내역을 조회하고 분석합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--md-space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Excel 가져오기 */}
          <label style={{
            padding: 'var(--md-space-sm) var(--md-space-lg)',
            borderRadius: 'var(--md-radius-full)',
            border: '1px solid var(--md-sys-light-outline)',
            backgroundColor: 'transparent',
            color: isImporting ? 'var(--md-sys-light-on-surface-variant)' : 'var(--md-sys-light-primary)',
            font: 'var(--md-label-large)',
            cursor: isImporting ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap',
          }}>
            <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelImport} disabled={isImporting} />
            {isImporting ? '가져오는 중...' : '↑ Excel 가져오기'}
          </label>
          {importResult && (
            <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', whiteSpace: 'nowrap' }}>
              신규 {importResult.inserted}건 · 중복 {importResult.skipped}건
            </span>
          )}
          <button
            onClick={openAdd}
            style={{
              padding: 'var(--md-space-sm) var(--md-space-lg)',
              borderRadius: 'var(--md-radius-full)',
              border: 'none',
              backgroundColor: 'var(--md-sys-light-primary)',
              color: 'var(--md-sys-light-on-primary)',
              font: 'var(--md-label-large)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            + 거래 추가
          </button>
        </div>
      </header>

      {isLoading ? (
        <div style={{ padding: 'var(--md-space-xl)', textAlign: 'center', color: 'var(--md-sys-light-on-surface-variant)' }}>로딩 중...</div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-lg)' }}>

      {/* 연도 탭 */}
      {availableYears.length > 0 && effectiveYear != null && (
        <YearTabs years={availableYears} selected={effectiveYear} onChange={setSelectedYear} />
      )}

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--md-space-md)' }}>
        {[
          { label: '총 거래 건수', value: `${yearFiltered.length.toLocaleString()}건`, color: undefined },
          { label: '총 수입', value: `₩${fmt(totalIncome)}`, color: '#1a7f37' },
          { label: '총 지출', value: `₩${fmt(totalExpense)}`, color: '#ba1a1a' },
          { label: '순수익', value: `${totalIncome - totalExpense >= 0 ? '+' : ''}₩${fmt(Math.abs(totalIncome - totalExpense))}`, color: totalIncome - totalExpense >= 0 ? '#1a7f37' : '#ba1a1a' },
        ].map(card => (
          <div key={card.label} style={{ ...cardStyle, padding: 'var(--md-space-md)' }}>
            <div style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ font: 'var(--md-title-medium)', color: card.color ?? 'var(--md-sys-light-on-surface)', fontWeight: 600 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 탭 + 필터 */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--md-space-md)', borderBottom: '1px solid var(--md-sys-light-outline-variant)', flexWrap: 'wrap', gap: 'var(--md-space-sm)' }}>
          <div style={{ display: 'flex' }}>
            {(['목록', '카테고리', '월별'] as Tab[]).map(tab => (
              <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </div>
          {activeTab === '목록' && (
            <div style={{ display: 'flex', gap: 'var(--md-space-sm)', alignItems: 'center', padding: 'var(--md-space-sm) 0', flexWrap: 'wrap' }}>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as TypeFilter)}
                style={{ padding: '5px 8px', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', font: 'var(--md-body-small)', backgroundColor: 'var(--md-sys-light-surface-container-high)', color: 'var(--md-sys-light-on-surface)' }}
              >
                {['전체', '지출', '수입', '이체'].map(t => <option key={t}>{t}</option>)}
              </select>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '5px 8px', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', font: 'var(--md-body-small)', backgroundColor: 'var(--md-sys-light-surface-container-high)', color: 'var(--md-sys-light-on-surface)' }}
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                placeholder="검색..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ padding: '5px 8px', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', font: 'var(--md-body-small)', backgroundColor: 'var(--md-sys-light-surface-container-high)', color: 'var(--md-sys-light-on-surface)', outline: 'none', width: 140 }}
              />
              <span style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                {filtered.length.toLocaleString()}건
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: 'var(--md-space-lg)' }}>

          {/* 목록 탭 */}
          {activeTab === '목록' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['날짜', '타입', '대분류', '소분류', '내용', '금액', '결제수단', ''].map((h, i) => (
                      <th key={i} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map(item => (
                    <tr key={item.id}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-sys-light-on-surface) 4%, transparent)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDate(item.transaction_date)}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: 'var(--md-radius-sm)', fontSize: '0.8em',
                          backgroundColor: item.transaction_type === '수입' ? '#e6f4ea' : item.transaction_type === '지출' ? '#fce8e6' : 'var(--md-sys-light-surface-container-high)',
                          color: item.transaction_type === '수입' ? '#1a7f37' : item.transaction_type === '지출' ? '#ba1a1a' : 'var(--md-sys-light-on-surface-variant)',
                        }}>
                          {item.transaction_type ?? '-'}
                        </span>
                      </td>
                      <td style={tdStyle}>{item.category ?? '-'}</td>
                      <td style={{ ...tdStyle, color: 'var(--md-sys-light-on-surface-variant)' }}>{item.subcategory ?? '-'}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description ?? '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: amountColor(item.transaction_type), fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {amountPrefix(item.transaction_type)}₩{fmt(item.amount)}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--md-sys-light-on-surface-variant)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.payment_method ?? '-'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => openEdit(item)}
                            style={{ padding: '2px 8px', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', background: 'transparent', font: 'var(--md-label-small)', cursor: 'pointer', color: 'var(--md-sys-light-primary)' }}
                          >편집</button>
                          <button
                            onClick={() => handleDelete(item)}
                            style={{ padding: '2px 8px', borderRadius: 'var(--md-radius-sm)', border: '1px solid var(--md-sys-light-outline-variant)', background: 'transparent', font: 'var(--md-label-small)', cursor: 'pointer', color: 'var(--md-sys-light-error)' }}
                          >삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--md-space-xl)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                  데이터가 없습니다.
                </div>
              )}
              {filtered.length > 200 && (
                <div style={{ textAlign: 'center', padding: 'var(--md-space-md)', font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                  200건 표시 중 (전체 {filtered.length.toLocaleString()}건)
                </div>
              )}
            </div>
          )}

          {/* 카테고리 탭 */}
          {activeTab === '카테고리' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-xl)' }}>
              <div style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-sm)' }}>
                지출 대분류 합계
              </div>
              <div style={{ display: 'flex', gap: 'var(--md-space-lg)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <ResponsiveContainer width={300} height={280}>
                  <PieChart>
                    <Pie data={categoryStats.slice(0, 12)} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={2} dataKey="value">
                      {categoryStats.slice(0, 12).map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₩${fmt(v)}`, '지출']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 200 }}>
                  {categoryStats.slice(0, 12).map((d, idx) => {
                    const total = categoryStats.reduce((s, i) => s + i.value, 0);
                    const pct = total > 0 ? (d.value / total * 100).toFixed(1) : '0.0';
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', font: 'var(--md-body-small)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, color: 'var(--md-sys-light-on-surface)' }}>{d.name}</span>
                        <span style={{ color: 'var(--md-sys-light-on-surface-variant)', flexShrink: 0 }}>{pct}%</span>
                        <span style={{ color: 'var(--md-sys-light-on-surface)', flexShrink: 0 }}>₩{fmt(d.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 월별 탭 */}
          {activeTab === '월별' && (
            <div>
              <div style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
                월별 수입/지출
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyStats} margin={{ top: 8, right: 16, left: 8, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-light-outline-variant)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--md-sys-light-on-surface-variant)', fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fill: 'var(--md-sys-light-on-surface-variant)', fontSize: 11 }} />
                  <Tooltip formatter={(v: number, name: string) => [`₩${fmt(v)}`, name === 'income' ? '수입' : name === 'expense' ? '지출' : '순수익']} />
                  <Bar dataKey="income" name="income" fill="#34A853" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="expense" fill="#EA4335" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {/* 거래 추가/편집 모달 */}
      {isModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--md-space-md)' }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div style={{
            backgroundColor: 'var(--md-sys-light-surface)',
            borderRadius: 'var(--md-radius-xl)',
            padding: 'var(--md-space-xl)',
            width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: 'var(--md-shadow-strong)',
          }}>
            <h2 style={{ font: 'var(--md-title-medium)', color: 'var(--md-sys-light-on-surface)', margin: '0 0 var(--md-space-lg)' }}>
              {editTarget ? '거래 편집' : '거래 추가'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-space-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>날짜 *</label>
                <input type="date" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>시간</label>
                <input type="time" value={form.transaction_time} onChange={e => setForm(f => ({ ...f, transaction_time: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>타입 *</label>
                <select value={form.transaction_type} onChange={e => setForm(f => ({ ...f, transaction_type: e.target.value }))} style={inputStyle}>
                  {['지출', '수입', '이체'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>금액 *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>대분류 *</label>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="식비, 급여..." style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>소분류</label>
                <input value={form.subcategory} onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))} placeholder="한식, 미분류..." style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>내용</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="거래처명, 상호..." style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>결제수단</label>
                <input value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} placeholder="카카오페이..." style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>화폐</label>
                <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} placeholder="KRW" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                <label style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>메모</label>
                <input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="메모 입력..." style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--md-space-sm)', justifyContent: 'flex-end', marginTop: 'var(--md-space-xl)' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ padding: 'var(--md-space-sm) var(--md-space-lg)', borderRadius: 'var(--md-radius-full)', border: '1px solid var(--md-sys-light-outline)', background: 'transparent', font: 'var(--md-label-large)', cursor: 'pointer', color: 'var(--md-sys-light-on-surface-variant)' }}
              >취소</button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !form.transaction_date || !form.category || !form.amount}
                style={{ padding: 'var(--md-space-sm) var(--md-space-lg)', borderRadius: 'var(--md-radius-full)', border: 'none', backgroundColor: 'var(--md-sys-light-primary)', color: 'var(--md-sys-light-on-primary)', font: 'var(--md-label-large)', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
              >{isSaving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
