import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataVisualization from '@/components/DataVisualization';
import { useUploads } from '@/hooks/useUploads';

export default function Visualization() {
  const [searchParams] = useSearchParams();
  const uploadIdFromQuery = searchParams.get('uploadId');
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(
    uploadIdFromQuery ? parseInt(uploadIdFromQuery, 10) : null
  );
  const { data: uploads = [], isLoading } = useUploads();

  useEffect(() => {
    if (uploadIdFromQuery) {
      const id = parseInt(uploadIdFromQuery, 10);
      if (!isNaN(id)) {
        setSelectedUploadId(id);
      }
    }
  }, [uploadIdFromQuery]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--md-space-xl)' }}>
        <h1
          style={{
            font: 'var(--md-title-large)',
            color: 'var(--md-sys-light-on-surface)',
            marginBottom: 'var(--md-space-sm)',
          }}
        >
          데이터 시각화
        </h1>
        <p
          style={{
            font: 'var(--md-body-medium)',
            color: 'var(--md-sys-light-on-surface-variant)',
          }}
        >
          업로드된 엑셀 데이터를 차트와 테이블로 시각화합니다
        </p>
      </header>

      {!selectedUploadId && (
        <div
          style={{
            backgroundColor: 'var(--md-sys-light-surface-container)',
            borderRadius: 'var(--md-radius-lg)',
            border: '1px solid var(--md-sys-light-outline-variant)',
            padding: 'var(--md-space-lg)',
            marginBottom: 'var(--md-space-lg)',
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
            업로드 선택
          </h2>
          {isLoading ? (
            <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
              로딩 중...
            </p>
          ) : uploads.length === 0 ? (
            <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
              업로드된 파일이 없습니다. 먼저 파일을 업로드해주세요.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-space-sm)' }}>
              {uploads.map((upload) => (
                <button
                  key={upload.id}
                  onClick={() => setSelectedUploadId(upload.id)}
                  style={{
                    padding: 'var(--md-space-sm) var(--md-space-md)',
                    borderRadius: 'var(--md-radius-md)',
                    backgroundColor: 'var(--md-sys-light-surface-container-high)',
                    color: 'var(--md-sys-light-on-surface)',
                    border: '1px solid var(--md-sys-light-outline-variant)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    font: 'var(--md-label-large)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--md-sys-light-secondary-container)';
                    e.currentTarget.style.color = 'var(--md-sys-light-on-secondary-container)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)';
                    e.currentTarget.style.color = 'var(--md-sys-light-on-surface)';
                  }}
                >
                  {upload.filename} ({upload.sheet_count}개 시트)
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedUploadId && (
        <div>
          <div
            style={{
              marginBottom: 'var(--md-space-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--md-space-md)',
            }}
          >
            <button
              onClick={() => setSelectedUploadId(null)}
              style={{
                padding: 'var(--md-space-xs) var(--md-space-sm)',
                borderRadius: 'var(--md-radius-sm)',
                backgroundColor: 'transparent',
                color: 'var(--md-sys-light-on-surface-variant)',
                border: '1px solid var(--md-sys-light-outline-variant)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                font: 'var(--md-label-small)',
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
              ← 다른 파일 선택
            </button>
          </div>
          <DataVisualization uploadId={selectedUploadId} />
        </div>
      )}
    </div>
  );
}

