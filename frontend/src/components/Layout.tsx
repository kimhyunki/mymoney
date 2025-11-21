import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

interface MenuItem {
  path: string;
  label: string;
  icon?: string;
}

const menuItems: MenuItem[] = [
  { path: '/', label: '홈', icon: '🏠' },
  { path: '/uploads', label: '데이터 업로드', icon: '📤' },
  { path: '/visualization', label: '데이터 시각화', icon: '📊' },
  { path: '/customers', label: '고객 정보', icon: '👥' },
  { path: '/cashflow', label: '현금 흐름', icon: '💰' },
];

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 모바일 메뉴는 화면 크기가 변경되면 자동으로 닫힘
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 라우트 변경 시 모바일 메뉴 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--md-sys-light-surface)' }}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static
          top-0 left-0
          h-full lg:h-auto
          w-80
          z-50 lg:z-auto
          transform transition-transform duration-300 ease-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          backgroundColor: 'var(--md-sys-light-surface)',
          borderRight: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
        }}
      >
        {/* Brand/Logo */}
        <div
          style={{
            paddingBottom: 'var(--md-space-lg)',
            borderBottom: '1px solid var(--md-sys-light-outline-variant)',
            marginBottom: 'var(--md-space-lg)',
          }}
        >
          <h1
            style={{
              font: 'var(--md-title-large)',
              color: 'var(--md-sys-light-on-surface)',
              margin: 0,
            }}
          >
            MyMoney
          </h1>
          <p
            style={{
              font: 'var(--md-body-medium)',
              color: 'var(--md-sys-light-on-surface-variant)',
              marginTop: 'var(--md-space-sm)',
              marginBottom: 0,
            }}
          >
            엑셀 데이터 시각화
          </p>
        </div>

        {/* Navigation Menu */}
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} style={{ marginBottom: 'var(--md-space-xs)' }}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--md-space-sm)',
                      padding: 'var(--md-space-sm) var(--md-space-md)',
                      borderRadius: 'var(--md-radius-md)',
                      textDecoration: 'none',
                      color: isActive
                        ? 'var(--md-sys-light-on-surface)'
                        : 'var(--md-sys-light-on-surface-variant)',
                      backgroundColor: isActive
                        ? 'var(--md-sys-light-surface-container-high)'
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      font: 'var(--md-label-large)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-sys-light-on-surface) 8%, transparent)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {item.icon && <span style={{ fontSize: '1.2em' }}>{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1"
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container-lowest)',
          padding: 'var(--md-space-lg)',
          minHeight: '100vh',
          width: '100%',
          marginLeft: 0,
        }}
      >
        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-50"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--md-sys-light-surface-container)',
            color: 'var(--md-sys-light-on-surface)',
            border: '1px solid var(--md-sys-light-outline-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            boxShadow: 'var(--md-shadow-medium)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container)';
          }}
          aria-label="메뉴 열기"
        >
          <span style={{ fontSize: '1.5em' }}>☰</span>
        </button>

        <Outlet />
      </main>
    </div>
  );
}

