import { useState, useRef } from 'react';
import { useUploadFile } from '@/hooks/useUploadFile';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFile();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // 파일 형식 검증
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('지원하는 파일 형식은 .xlsx 또는 .xls입니다.');
      return;
    }

    setError(null);
    setSuccess(null);

    uploadMutation.mutate(file, {
      onSuccess: (result) => {
        setSuccess(result.message);
        onUploadSuccess();
        
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.');
      },
    });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        style={{
          border: `2px dashed ${isDragging ? 'var(--md-sys-light-secondary-container)' : 'var(--md-sys-light-outline-variant)'}`,
          borderRadius: 'var(--md-radius-lg)',
          padding: 'var(--md-space-xl)',
          textAlign: 'center',
          cursor: uploadMutation.isPending ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: isDragging
            ? 'color-mix(in srgb, var(--md-sys-light-secondary-container) 10%, transparent)'
            : 'var(--md-sys-light-surface-container-high)',
          opacity: uploadMutation.isPending ? 0.5 : 1,
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploadMutation.isPending}
        />
        
        {uploadMutation.isPending ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-sm)', alignItems: 'center' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '2px solid var(--md-sys-light-secondary-container)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
              업로드 중...
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-sm)', alignItems: 'center' }}>
            <svg
              style={{ width: '48px', height: '48px', color: 'var(--md-sys-light-on-surface-variant)' }}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface)' }}>
              파일을 드래그 앤 드롭하거나 클릭하여 선택하세요
            </p>
            <p style={{ font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)' }}>
              .xlsx, .xls 파일만 지원됩니다
            </p>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 'var(--md-space-md)',
            padding: 'var(--md-space-md)',
            backgroundColor: 'rgba(186, 26, 26, 0.15)',
            border: '1px solid rgba(186, 26, 26, 0.3)',
            borderRadius: 'var(--md-radius-md)',
            color: '#EFB8B8',
            font: 'var(--md-label-small)',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: 'var(--md-space-md)',
            padding: 'var(--md-space-md)',
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: 'var(--md-radius-md)',
            color: '#A5D6A7',
            font: 'var(--md-label-small)',
          }}
        >
          {success}
        </div>
      )}
    </div>
  );
}

