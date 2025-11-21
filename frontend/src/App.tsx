import { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataVisualization from './components/DataVisualization';
import CustomerInfo from './components/CustomerInfo';
import CashFlowStatus from './components/CashFlowStatus';
import { useUploads } from './hooks/useUploads';

function App() {
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);

  const { data: uploads = [], isLoading, refetch } = useUploads();

  const handleUploadSuccess = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            MyMoney - 엑셀 데이터 시각화
          </h1>
          <p className="text-gray-600">
            엑셀 파일을 업로드하고 데이터를 시각화하세요
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">파일 업로드</h2>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">업로드 이력</h2>
              {isLoading ? (
                <p className="text-gray-500">로딩 중...</p>
              ) : uploads.length === 0 ? (
                <p className="text-gray-500">업로드된 파일이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {uploads.map((upload) => (
                    <li
                      key={upload.id}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedUploadId === upload.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedUploadId(upload.id)}
                    >
                      <div className="font-medium text-gray-900">
                        {upload.filename}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(upload.uploaded_at).toLocaleString('ko-KR')} ·{' '}
                        {upload.sheet_count}개 시트
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <CustomerInfo />
          </div>

          <div className="lg:col-span-2">
            {selectedUploadId ? (
              <div className="space-y-6">
                <DataVisualization uploadId={selectedUploadId} />
                <CashFlowStatus />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <p className="text-gray-500 text-lg">
                    왼쪽에서 업로드 이력을 선택하여 데이터를 시각화하세요
                  </p>
                </div>
                <CashFlowStatus />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

