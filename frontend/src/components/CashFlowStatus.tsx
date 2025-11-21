import { useQuery } from '@tanstack/react-query';
import { getCashFlows } from '@/lib/api';
import CashFlowCharts from './CashFlowCharts';

function CashFlowStatus() {
  const { data: cashFlows = [], isLoading, error } = useQuery({
    queryKey: ['cashFlows'],
    queryFn: () => getCashFlows(),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">현금 흐름 현황</h2>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">현금 흐름 현황</h2>
        <p className="text-red-500">현금 흐름 현황을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  if (cashFlows.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">현금 흐름 현황</h2>
        <p className="text-gray-500">등록된 현금 흐름 현황이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">현금 흐름 현황</h2>
      <CashFlowCharts cashFlows={cashFlows} />
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          현금 흐름 현황은 30초마다 자동으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}

export default CashFlowStatus;

