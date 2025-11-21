import { useState, useEffect } from 'react';
import { useSheets } from '@/hooks/useSheets';
import { useSheetData } from '@/hooks/useSheetData';
import ChartTypes from './ChartTypes';

interface DataVisualizationProps {
  uploadId: number;
}

export default function DataVisualization({ uploadId }: DataVisualizationProps) {
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  
  const { data: sheets = [], isLoading: sheetsLoading, error: sheetsError } = useSheets(uploadId);
  const { data: selectedSheet, isLoading: sheetDataLoading, isFetching: sheetDataFetching, error: sheetDataError } = useSheetData(selectedSheetId);

  // 첫 번째 시트 자동 선택
  useEffect(() => {
    if (sheets.length > 0 && !selectedSheetId) {
      setSelectedSheetId(sheets[0].id);
    }
  }, [sheets, selectedSheetId]);

  const loading = sheetsLoading || sheetDataLoading;
  const error = sheetsError || sheetDataError;
  
  // 현재 선택된 시트의 데이터인지 확인
  const isCurrentSheetData = selectedSheet && selectedSheetId !== null && selectedSheet.sheet.id === selectedSheetId;

  // placeholderData를 사용하면 이전 데이터가 유지되므로 로딩 중에도 이전 데이터를 표시
  // 초기 로딩 시에만 로딩 화면 표시
  if (loading && !selectedSheet) {
    return (
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
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid var(--md-sys-light-secondary-container)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}
        />
        <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-md)' }}>
          로딩 중...
        </p>
      </div>
    );
  }

  if (error && !selectedSheet) {
    return (
      <div
        style={{
          backgroundColor: 'var(--md-sys-light-surface-container)',
          borderRadius: 'var(--md-radius-lg)',
          border: '1px solid var(--md-sys-light-outline-variant)',
          padding: 'var(--md-space-lg)',
          boxShadow: 'var(--md-shadow-soft)',
        }}
      >
        <div
          style={{
            padding: 'var(--md-space-md)',
            backgroundColor: 'rgba(186, 26, 26, 0.15)',
            border: '1px solid rgba(186, 26, 26, 0.3)',
            borderRadius: 'var(--md-radius-md)',
            color: '#EFB8B8',
            font: 'var(--md-body-medium)',
          }}
        >
          {error instanceof Error ? error.message : String(error)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-lg)' }}>
      {sheets.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--md-sys-light-surface-container)',
            borderRadius: 'var(--md-radius-lg)',
            border: '1px solid var(--md-sys-light-outline-variant)',
            padding: 'var(--md-space-md)',
            boxShadow: 'var(--md-shadow-soft)',
          }}
        >
          <h3 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
            시트 선택
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-space-sm)' }}>
            {sheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => setSelectedSheetId(sheet.id)}
                style={{
                  padding: 'var(--md-space-sm) var(--md-space-md)',
                  borderRadius: 'var(--md-radius-md)',
                  transition: 'all 0.2s ease',
                  font: 'var(--md-label-large)',
                  backgroundColor:
                    selectedSheetId === sheet.id
                      ? 'var(--md-sys-light-secondary-container)'
                      : 'var(--md-sys-light-surface-container-high)',
                  color:
                    selectedSheetId === sheet.id
                      ? 'var(--md-sys-light-on-secondary-container)'
                      : 'var(--md-sys-light-on-surface)',
                  border: '1px solid var(--md-sys-light-outline-variant)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (selectedSheetId !== sheet.id) {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--md-sys-light-on-surface) 8%, transparent)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSheetId !== sheet.id) {
                    e.currentTarget.style.backgroundColor = 'var(--md-sys-light-surface-container-high)';
                  }
                }}
              >
                {sheet.sheet_name} ({sheet.row_count}행 × {sheet.column_count}열)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 시트 데이터 로딩 중이거나 현재 시트 데이터가 아닐 때 */}
      {selectedSheetId !== null && (sheetDataFetching || !isCurrentSheetData) && (
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
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid var(--md-sys-light-secondary-container)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }}
          />
          <p style={{ font: 'var(--md-body-medium)', color: 'var(--md-sys-light-on-surface-variant)', marginTop: 'var(--md-space-md)' }}>
            시트 데이터 로딩 중...
          </p>
        </div>
      )}

      {isCurrentSheetData && selectedSheet && !sheetDataFetching && (
        <div
          style={{
            backgroundColor: 'var(--md-sys-light-surface-container)',
            borderRadius: 'var(--md-radius-lg)',
            border: '1px solid var(--md-sys-light-outline-variant)',
            padding: 'var(--md-space-lg)',
            boxShadow: 'var(--md-shadow-soft)',
          }}
        >
          <h2 style={{ font: 'var(--md-title-large)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
            {selectedSheet.sheet.sheet_name}
          </h2>
          
          {error && (
            <div
              style={{
                marginBottom: 'var(--md-space-md)',
                padding: 'var(--md-space-md)',
                backgroundColor: 'rgba(186, 26, 26, 0.15)',
                border: '1px solid rgba(186, 26, 26, 0.3)',
                borderRadius: 'var(--md-radius-md)',
                color: '#EFB8B8',
                font: 'var(--md-label-small)',
              }}
            >
              {error instanceof Error ? error.message : '오류가 발생했습니다.'}
            </div>
          )}

          <div style={{ marginBottom: 'var(--md-space-lg)' }}>
            <ChartTypes data={selectedSheet} />
          </div>

          <div style={{ marginTop: 'var(--md-space-lg)' }}>
            <h3 style={{ font: 'var(--md-title-small)', color: 'var(--md-sys-light-on-surface)', marginBottom: 'var(--md-space-md)' }}>
              데이터 테이블
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--md-sys-light-surface-container-high)' }}>
                    {selectedSheet.records.length > 0 &&
                      selectedSheet.records[0].data &&
                      Object.keys(selectedSheet.records[0].data).map((key) => (
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
                  {selectedSheet.records.slice(0, 100).map((record) => (
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
                          }}
                        >
                          {value !== null && value !== undefined ? String(value) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedSheet.records.length > 100 && (
                <p style={{ marginTop: 'var(--md-space-sm)', font: 'var(--md-label-small)', color: 'var(--md-sys-light-on-surface-variant)', textAlign: 'center' }}>
                  처음 100개 행만 표시됩니다. (전체: {selectedSheet.records.length}행)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

