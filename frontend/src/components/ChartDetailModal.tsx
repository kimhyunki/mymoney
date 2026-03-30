import { useEffect } from 'react';
import type { ChartDetailData } from '@/types';
import { formatNumber } from '@/utils/format';

interface ChartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChartDetailData | null;
}

export default function ChartDetailModal({ isOpen, onClose, data }: ChartDetailModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen || !data) {
    return null;
  }

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--md-space-lg)',
        }}
      >
        {/* 모달 컨텐츠 */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--md-sys-light-surface-container)',
            borderRadius: 'var(--md-radius-lg)',
            border: '1px solid var(--md-sys-light-outline-variant)',
            boxShadow: 'var(--md-shadow-soft)',
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              padding: 'var(--md-space-lg)',
              borderBottom: '1px solid var(--md-sys-light-outline-variant)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2
                style={{
                  font: 'var(--md-title-large)',
                  color: 'var(--md-sys-light-on-surface)',
                  margin: 0,
                  marginBottom: 'var(--md-space-xs)',
                }}
              >
                {data.title}
              </h2>
              {data.label && (
                <p
                  style={{
                    font: 'var(--md-body-medium)',
                    color: 'var(--md-sys-light-on-surface-variant)',
                    margin: 0,
                  }}
                >
                  {data.label}
                  {data.value !== undefined && (
                    <span style={{ marginLeft: 'var(--md-space-sm)' }}>
                      {typeof data.value === 'number' 
                        ? new Intl.NumberFormat('ko-KR', {
                            style: 'currency',
                            currency: 'KRW',
                          }).format(data.value)
                        : data.value}
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                padding: 'var(--md-space-xs)',
                borderRadius: 'var(--md-radius-sm)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--md-sys-light-on-surface-variant)',
                font: 'var(--md-label-large)',
                minWidth: '40px',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)';
                e.currentTarget.style.color = 'var(--md-sys-light-on-surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--md-sys-light-on-surface-variant)';
              }}
            >
              ✕
            </button>
          </div>

          {/* 컨텐츠 */}
          <div
            style={{
              padding: 'var(--md-space-lg)',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {data.records.length === 0 ? (
              <p
                style={{
                  font: 'var(--md-body-medium)',
                  color: 'var(--md-sys-light-on-surface-variant)',
                  textAlign: 'center',
                  padding: 'var(--md-space-xl)',
                }}
              >
                관련된 원본 데이터를 찾을 수 없습니다.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '600px',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--md-sys-light-surface-container-high)',
                      }}
                    >
                      {data.records.length > 0 &&
                        data.records[0].data &&
                        Object.keys(data.records[0].data).map((key) => (
                          <th
                            key={key}
                            style={{
                              padding: 'var(--md-space-md)',
                              textAlign: 'left',
                              font: 'var(--md-label-small)',
                              color: 'var(--md-sys-light-on-surface-variant)',
                              textTransform: 'uppercase',
                              borderBottom: '1px solid var(--md-sys-light-outline-variant)',
                            }}
                          >
                            열 {parseInt(key) + 1}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((record) => (
                      <tr
                        key={record.id}
                        style={{
                          borderBottom: '1px solid var(--md-sys-light-outline-variant)',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {Object.values(record.data).map((value, idx) => (
                          <td
                            key={idx}
                            style={{
                              padding: 'var(--md-space-md)',
                              whiteSpace: 'nowrap',
                              font: 'var(--md-label-small)',
                              color: 'var(--md-sys-light-on-surface)',
                              textAlign:
                                typeof value === 'number' ||
                                (typeof value === 'string' && !isNaN(Number(value)) && value !== '')
                                  ? 'right'
                                  : 'left',
                            }}
                          >
                            {formatNumber(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p
                  style={{
                    marginTop: 'var(--md-space-md)',
                    font: 'var(--md-label-small)',
                    color: 'var(--md-sys-light-on-surface-variant)',
                    textAlign: 'center',
                  }}
                >
                  총 {data.records.length}개의 레코드
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

