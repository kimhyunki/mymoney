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
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-500 mt-4">로딩 중...</p>
      </div>
    );
  }

  if (error && !selectedSheet) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error instanceof Error ? error.message : String(error)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sheets.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-3">시트 선택</h3>
          <div className="flex flex-wrap gap-2">
            {sheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => setSelectedSheetId(sheet.id)}
                className={`px-4 py-2 rounded transition-colors ${
                  selectedSheetId === sheet.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sheet.sheet_name} ({sheet.row_count}행 × {sheet.column_count}열)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 시트 데이터 로딩 중이거나 현재 시트 데이터가 아닐 때 */}
      {selectedSheetId !== null && (sheetDataFetching || !isCurrentSheetData) && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">시트 데이터 로딩 중...</p>
        </div>
      )}

      {isCurrentSheetData && selectedSheet && !sheetDataFetching && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {selectedSheet.sheet.sheet_name}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error instanceof Error ? error.message : '오류가 발생했습니다.'}
            </div>
          )}

          <div className="mb-6">
            <ChartTypes data={selectedSheet} />
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">데이터 테이블</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedSheet.records.length > 0 && selectedSheet.records[0].data && 
                      Object.keys(selectedSheet.records[0].data).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          열 {parseInt(key) + 1}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedSheet.records.slice(0, 100).map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      {Object.values(record.data).map((value, idx) => (
                        <td key={idx} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {value !== null && value !== undefined ? String(value) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedSheet.records.length > 100 && (
                <p className="mt-2 text-sm text-gray-500 text-center">
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

