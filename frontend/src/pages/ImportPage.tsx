import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { importBanksaladExcel, getUploadHistory, type ImportBanksaladResult } from '@/lib/api';
import type { UploadHistory } from '@/types';

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--md-sys-light-surface-container)',
  borderRadius: 'var(--md-radius-lg)',
  border: '1px solid var(--md-sys-light-outline-variant)',
  padding: 'var(--md-space-xl, 24px)',
  boxShadow: 'var(--md-shadow-soft)',
};

const btnBase: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 'var(--md-radius-sm)',
  border: 'none',
  cursor: 'pointer',
  font: 'var(--md-label-large)',
};

function fmtBytes(b: number | null): string {
  if (b == null) return '-';
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function ResultBadge({ label, updated, inserted, skipped }: {
  label: string;
  updated?: number;
  inserted?: number;
  skipped?: number;
}) {
  const parts = [];
  if (inserted != null && inserted > 0) parts.push(`+${inserted}`);
  if (updated != null && updated > 0) parts.push(`~${updated}`);
  if (skipped != null && skipped > 0) parts.push(`skip ${skipped}`);
  if (parts.length === 0) return null;
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: 4,
      fontSize: 11,
      background: 'var(--md-sys-light-surface-container-high)',
      color: 'var(--md-sys-light-on-surface-variant)',
      marginRight: 4,
    }}>
      {label}: {parts.join(' ')}
    </span>
  );
}

export default function ImportPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportBanksaladResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: history = [], refetch: refetchHistory } = useQuery<UploadHistory[]>({
    queryKey: ['upload-history'],
    queryFn: getUploadHistory,
    refetchInterval: 30000,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await importBanksaladExcel(selectedFile);
      setResult(res);
      // 모든 관련 쿼리 무효화하여 각 탭에 최신 데이터 반영
      queryClient.invalidateQueries();
      refetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : '가져오기 실패');
    } finally {
      setIsImporting(false);
    }
  };

  const total =
    result
      ? result.customer.updated + result.customer.inserted
        + result.cash_flow.updated + result.cash_flow.inserted
        + result.monthly_summary.updated + result.monthly_summary.inserted
        + result.investment.updated + result.investment.inserted
        + result.financial_snapshot.updated + result.financial_snapshot.inserted
        + result.ledger.inserted
      : 0;

  return (
    <div style={{ padding: 'var(--md-space-lg, 16px)' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 'var(--md-space-lg, 16px)' }}>
        <h2 style={{ font: 'var(--md-headline-small)', margin: 0 }}>Excel 가져오기</h2>
        <p style={{
          font: 'var(--md-body-medium)',
          color: 'var(--md-sys-light-on-surface-variant)',
          marginTop: 4, marginBottom: 0,
        }}>
          뱅크샐러드 Excel 파일을 업로드하면 모든 탭(고객 정보·현금흐름·월별 결산·가계부 내역)의 데이터가 최신으로 갱신됩니다.
        </p>
      </div>

      {/* 업로드 카드 */}
      <div style={{ ...cardStyle, maxWidth: 640 }}>
        <h3 style={{ font: 'var(--md-title-medium)', marginTop: 0, marginBottom: 8 }}>
          뱅크샐러드 Excel 파일
        </h3>
        <p style={{
          font: 'var(--md-body-small)',
          color: 'var(--md-sys-light-on-surface-variant)',
          marginTop: 0, marginBottom: 16,
        }}>
          지원 형식: <code>.xlsx</code> · 포함 시트: <strong>뱅샐현황</strong> · <strong>가계부 내역</strong>
        </p>

        {/* 파일 선택 영역 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...btnBase,
              background: 'var(--md-sys-light-surface-container-high)',
              border: '1px solid var(--md-sys-light-outline-variant)',
              color: 'var(--md-sys-light-on-surface)',
              whiteSpace: 'nowrap',
            }}
          >
            파일 선택
          </button>
          <span style={{
            font: 'var(--md-body-medium)',
            color: selectedFile
              ? 'var(--md-sys-light-on-surface)'
              : 'var(--md-sys-light-on-surface-variant)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selectedFile ? selectedFile.name : '선택된 파일 없음'}
          </span>
        </div>

        {/* 가져오기 버튼 */}
        <button
          onClick={handleImport}
          disabled={!selectedFile || isImporting}
          style={{
            ...btnBase,
            background: !selectedFile || isImporting
              ? 'var(--md-sys-light-surface-container-high)'
              : 'var(--md-sys-light-primary)',
            color: !selectedFile || isImporting
              ? 'var(--md-sys-light-on-surface-variant)'
              : 'var(--md-sys-light-on-primary)',
            cursor: !selectedFile || isImporting ? 'not-allowed' : 'pointer',
          }}
        >
          {isImporting ? '가져오는 중...' : '가져오기'}
        </button>

        {/* 오류 */}
        {error && (
          <div style={{
            marginTop: 16, padding: 12,
            borderRadius: 'var(--md-radius-sm)',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            font: 'var(--md-body-small)',
          }}>
            오류: {error}
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div style={{
            marginTop: 16, padding: 16,
            borderRadius: 'var(--md-radius-sm)',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}>
            <p style={{ font: 'var(--md-label-large)', color: '#166534', margin: '0 0 10px' }}>
              가져오기 완료 · 총 {total}건 처리
            </p>
            <table style={{ borderCollapse: 'collapse', width: '100%', font: 'var(--md-body-small)' }}>
              <thead>
                <tr>
                  {['구분', '수정', '신규', '중복'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '4px 8px',
                      color: '#15803d', borderBottom: '1px solid #bbf7d0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>고객 정보</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.customer.updated}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.customer.inserted}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>-</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>현금흐름</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.cash_flow.updated}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.cash_flow.inserted}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>-</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>월별 결산</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.monthly_summary.updated}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.monthly_summary.inserted}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>-</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>투자 현황</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.investment.updated}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.investment.inserted}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>-</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>재무 현황</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.financial_snapshot.updated}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.financial_snapshot.inserted}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>-</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>가계부 내역</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>-</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.ledger.inserted}</td>
                  <td style={{ padding: '4px 8px', color: '#166534' }}>{result.ledger.skipped}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div style={{ marginTop: 24, maxWidth: 640 }}>
        <p style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', margin: 0 }}>
          매월 새 파일을 업로드하면 기존 데이터를 유지한 채 변경분만 반영됩니다.
          가계부 내역은 (날짜·시간·내용·금액)으로 중복을 자동 제거합니다.
        </p>
      </div>

      {/* 업로드 이력 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ font: 'var(--md-title-medium)', margin: '0 0 12px' }}>
          업로드 이력
          <span style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', marginLeft: 8 }}>
            ({history.length}건)
          </span>
        </h3>

        {history.length === 0 ? (
          <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)' }}>
            아직 업로드 이력이 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 760 }}>
            {history.map((h) => {
              const r = h.result_json;
              const uploadedAt = new Date(h.created_at).toLocaleString('ko-KR');
              return (
                <div key={h.id} style={{
                  ...cardStyle,
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-sys-light-on-surface)', wordBreak: 'break-all' }}>
                      {h.filename}
                    </span>
                    <span style={{ font: 'var(--md-body-small)', color: 'var(--md-sys-light-on-surface-variant)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {uploadedAt} · {fmtBytes(h.file_size)}
                    </span>
                  </div>
                  {r && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <ResultBadge label="고객" updated={r.customer?.updated} inserted={r.customer?.inserted} />
                      <ResultBadge label="현금흐름" updated={r.cash_flow?.updated} inserted={r.cash_flow?.inserted} />
                      <ResultBadge label="월별결산" updated={r.monthly_summary?.updated} inserted={r.monthly_summary?.inserted} />
                      <ResultBadge label="투자" updated={r.investment?.updated} inserted={r.investment?.inserted} />
                      <ResultBadge label="재무현황" updated={r.financial_snapshot?.updated} inserted={r.financial_snapshot?.inserted} />
                      <ResultBadge label="가계부" inserted={r.ledger?.inserted} skipped={r.ledger?.skipped} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
