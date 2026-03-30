import { useQuery } from '@tanstack/react-query';
import { getUploads, getCustomers, getCashFlows, getFixedExpenses, getMonthlySummaries } from '@/lib/api';
import { Link } from 'react-router-dom';

export default function Home() {
  const { data: uploads = [] } = useQuery({
    queryKey: ['uploads'],
    queryFn: getUploads,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const { data: cashFlows = [] } = useQuery({
    queryKey: ['cashFlows'],
    queryFn: () => getCashFlows(),
  });

  const { data: fixedExpenses = [] } = useQuery({
    queryKey: ['fixedExpenses'],
    queryFn: () => getFixedExpenses(),
  });

  const { data: monthlySummaries = [] } = useQuery({
    queryKey: ['monthlySummaries'],
    queryFn: () => getMonthlySummaries(),
  });

  const now = new Date();
  const currentMonthSummary = monthlySummaries.find(
    s => s.year === now.getFullYear() && s.month === now.getMonth() + 1
  );

  const stats = [
    {
      label: '업로드된 파일',
      value: uploads.length,
      icon: '📤',
      link: '/uploads',
      color: 'var(--md-sys-light-secondary-container)',
    },
    {
      label: '고객 정보',
      value: customers.length,
      icon: '👥',
      link: '/customers',
      color: 'var(--md-sys-light-secondary-container)',
    },
    {
      label: '현금 흐름 기록',
      value: cashFlows.length,
      icon: '💰',
      link: '/cashflow',
      color: 'var(--md-sys-light-secondary-container)',
    },
    {
      label: '고정비 항목',
      value: fixedExpenses.length,
      icon: '📋',
      link: '/fixed-expenses',
      color: 'var(--md-sys-light-secondary-container)',
    },
    {
      label: '이번 달 순수익',
      value: currentMonthSummary?.net_income != null
        ? `${(currentMonthSummary.net_income / 10_000).toFixed(0)}만원`
        : '-',
      icon: '📅',
      link: '/monthly-summary',
      color: 'var(--md-sys-light-secondary-container)',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)' }}>
        <h1
          style={{
            font: 'var(--md-title-large)',
            color: 'var(--md-sys-light-on-surface)',
            marginBottom: 'var(--md-space-sm)',
          }}
        >
          대시보드
        </h1>
        <p
          style={{
            font: 'var(--md-body-medium)',
            color: 'var(--md-sys-light-on-surface-variant)',
          }}
        >
          MyMoney 데이터 현황을 한눈에 확인하세요
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--md-space-lg)',
          marginBottom: 'var(--md-space-xl)',
        }}
      >
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            style={{
              textDecoration: 'none',
              display: 'block',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--md-sys-light-surface-container)',
                borderRadius: 'var(--md-radius-lg)',
                border: '1px solid var(--md-sys-light-outline-variant)',
                padding: 'var(--md-space-lg)',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--md-shadow-soft)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--md-shadow-medium)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--md-shadow-soft)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-md)', marginBottom: 'var(--md-space-md)' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--md-radius-md)',
                    backgroundColor: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5em',
                  }}
                >
                  {stat.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      font: 'var(--md-label-large)',
                      color: 'var(--md-sys-light-on-surface-variant)',
                      margin: 0,
                      marginBottom: 'var(--md-space-xs)',
                    }}
                  >
                    {stat.label}
                  </h3>
                  <p
                    style={{
                      font: 'var(--md-title-large)',
                      color: 'var(--md-sys-light-on-surface)',
                      margin: 0,
                    }}
                  >
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
          boxShadow: 'var(--md-shadow-soft)',
        }}
      >
        <h2
          style={{
            font: 'var(--md-title-small)',
            color: 'var(--md-sys-light-on-surface)',
            marginBottom: 'var(--md-space-md)',
          }}
        >
          빠른 시작
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-md)' }}>
          <Link
            to="/uploads"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--md-space-sm)',
              padding: 'var(--md-space-sm) var(--md-space-md)',
              backgroundColor: 'var(--md-sys-light-secondary-container)',
              color: 'var(--md-sys-light-on-secondary-container)',
              borderRadius: 'var(--md-radius-full)',
              textDecoration: 'none',
              font: 'var(--md-label-large)',
              transition: 'all 0.2s ease',
              width: 'fit-content',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-sys-light-secondary-container) 85%, black)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-light-secondary-container)';
            }}
          >
            <span>📤</span>
            <span>새 파일 업로드</span>
          </Link>
          <Link
            to="/visualization"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--md-space-sm)',
              padding: 'var(--md-space-sm) var(--md-space-md)',
              backgroundColor: 'transparent',
              color: 'var(--md-sys-light-on-surface-variant)',
              border: '1px solid var(--md-sys-light-outline-variant)',
              borderRadius: 'var(--md-radius-md)',
              textDecoration: 'none',
              font: 'var(--md-label-large)',
              transition: 'all 0.2s ease',
              width: 'fit-content',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-sys-light-surface-container-high) 50%, transparent)';
              e.currentTarget.style.color = 'var(--md-sys-light-on-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--md-sys-light-on-surface-variant)';
            }}
          >
            <span>📊</span>
            <span>데이터 시각화</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

