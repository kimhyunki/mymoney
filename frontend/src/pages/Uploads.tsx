import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import { useUploads } from '@/hooks/useUploads';
import { Link } from 'react-router-dom';

export default function Uploads() {
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const { data: uploads = [], isLoading, refetch } = useUploads();

  const handleUploadSuccess = () => {
    refetch();
  };

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
          데이터 업로드
        </h1>
        <p
          style={{
            font: 'var(--md-body-medium)',
            color: 'var(--md-sys-light-on-surface-variant)',
          }}
        >
          엑셀 파일을 업로드하고 데이터를 시각화하세요
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--md-space-lg)',
        }}
        className="lg:grid-cols-[1fr_2fr]"
      >
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-lg)' }}>
          {/* File Upload Card */}
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
              파일 업로드
            </h2>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Upload History Card */}
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
              업로드 이력
            </h2>
            {isLoading ? (
              <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                로딩 중...
              </p>
            ) : uploads.length === 0 ? (
              <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                업로드된 파일이 없습니다.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--md-space-sm)' }}>
                {uploads.map((upload) => {
                  const isSelected = selectedUploadId === upload.id;
                  return (
                    <li key={upload.id}>
                      <button
                        onClick={() => setSelectedUploadId(upload.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: 'var(--md-space-md)',
                          borderRadius: 'var(--md-radius-md)',
                          border: isSelected
                            ? '2px solid var(--md-sys-light-secondary-container)'
                            : '2px solid transparent',
                          backgroundColor: isSelected
                            ? 'var(--md-sys-light-surface-container-high)'
                            : 'transparent',
                          color: 'var(--md-sys-light-on-surface)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          font: 'var(--md-body-medium)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-sys-light-on-surface) 8%, transparent)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div style={{ font: 'var(--md-label-large)', marginBottom: 'var(--md-space-xs)' }}>
                          {upload.filename}
                        </div>
                        <div style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                          {new Date(upload.uploaded_at).toLocaleString('ko-KR')} · {upload.sheet_count}개 시트
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column - Selected Upload Info */}
        <div>
          {selectedUploadId ? (
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
                선택된 파일 정보
              </h2>
              <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginBottom: 'var(--md-space-lg)' }}>
                데이터를 시각화하려면 아래 버튼을 클릭하세요.
              </p>
              <Link
                to={`/visualization?uploadId=${selectedUploadId}`}
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
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-sys-light-secondary-container) 85%, black)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--md-sys-light-secondary-container)';
                }}
              >
                <span>📊</span>
                <span>시각화하기</span>
              </Link>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--md-sys-light-surface-container)',
                borderRadius: 'var(--md-radius-lg)',
                border: '1px solid var(--md-sys-light-outline-variant)',
                padding: 'var(--md-space-xl)',
                textAlign: 'center',
                boxShadow: 'var(--md-shadow-soft)',
              }}
            >
              <p style={{ font: 'var(--md-body-large)', color: 'var(--md-sys-light-on-surface-variant)' }}>
                왼쪽에서 업로드 이력을 선택하여 데이터를 시각화하세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

