import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/lib/api';
import type { Customer } from '@/types';

function CustomerInfo() {
  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
    refetchInterval: 30000, // 30초마다 자동 갱신 (스케줄러와 동기화)
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">고객정보</h2>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">고객정보</h2>
        <p className="text-red-500">고객정보를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">고객정보</h2>
        <p className="text-gray-500">등록된 고객정보가 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">
          엑셀 파일을 업로드하면 고객정보가 자동으로 추출됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">고객정보</h2>
        <span className="text-sm text-gray-500">
          총 {customers.length}명
        </span>
      </div>
      
      <div className="space-y-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {customer.name}
                  </h3>
                  {customer.gender && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {customer.gender}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {customer.age !== null && (
                    <div>
                      <span className="text-gray-500">나이:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {customer.age}세
                      </span>
                    </div>
                  )}
                  
                  {customer.credit_score !== null && (
                    <div>
                      <span className="text-gray-500">신용점수:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {customer.credit_score.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {customer.email && (
                    <div className="col-span-2">
                      <span className="text-gray-500">이메일:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {customer.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>
                  등록일: {new Date(customer.created_at).toLocaleString('ko-KR')}
                </span>
                {customer.updated_at !== customer.created_at && (
                  <span>
                    최종 업데이트: {new Date(customer.updated_at).toLocaleString('ko-KR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          고객정보는 30초마다 자동으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}

export default CustomerInfo;

