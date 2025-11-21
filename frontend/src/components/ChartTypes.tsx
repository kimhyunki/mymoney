import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SheetWithData } from '@/types';
import { getMonthlyAggregation } from '@/utils/dataAnalysis';
import { formatMonth } from '@/utils/dateUtils';
import { parseCashFlow } from '@/utils/bankStatusParser';
import BankStatusCharts from './BankStatusCharts';

interface ChartTypesProps {
  data: SheetWithData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

/**
 * 데이터 구조를 분석해서 차트 타입을 자동으로 감지
 * 시트 이름이 아닌 데이터 구조 기반으로 판단
 */
function detectChartType(data: SheetWithData): 'bankStatus' | 'default' {
  // bankStatusParser가 파싱 가능한 구조인지 확인
  // parseCashFlow가 성공하면 뱅샐현황 구조로 판단
  const cashFlowData = parseCashFlow(data);
  if (cashFlowData) {
    return 'bankStatus';
  }
  return 'default';
}

export default function ChartTypes({ data }: ChartTypesProps) {
  // 데이터 구조 기반으로 차트 타입 자동 감지 (시트 이름 무관)
  const chartType = useMemo(() => {
    return detectChartType(data);
  }, [data]);

  // 뱅샐현황 구조인 경우 BankStatusCharts 사용
  const shouldUseBankStatusCharts = chartType === 'bankStatus';

  // 월별 집계 데이터 (모든 훅을 조건부 return 전에 호출해야 함)
  const monthlyData = useMemo(() => {
    return getMonthlyAggregation(data);
  }, [data]);

  // 차트용 월별 데이터 변환
  const monthlyChartData = useMemo(() => {
    return monthlyData.map(item => ({
      month: formatMonth(item.month),
      monthKey: item.month,
      수입: item.income,
      지출: item.expense,
      순수익: item.income - item.expense,
    }));
  }, [monthlyData]);

  // 데이터 변환: 첫 번째 열을 X축, 두 번째 열을 Y축으로 사용
  const chartData = useMemo(() => {
    if (!data.records || data.records.length === 0) return [];

    return data.records.map((record) => {
      const values = Object.values(record.data);
      return {
        name: values[0] !== null && values[0] !== undefined ? String(values[0]) : `행 ${record.row_index + 1}`,
        value: values.length > 1 && typeof values[1] === 'number' ? values[1] : 0,
        value2: values.length > 2 && typeof values[2] === 'number' ? values[2] : 0,
        value3: values.length > 3 && typeof values[3] === 'number' ? values[3] : 0,
      };
    }).filter((item) => item.value !== 0 || item.value2 !== 0 || item.value3 !== 0);
  }, [data.records]);

  // 파이 차트용 데이터 (숫자 값만)
  const pieData = useMemo(() => {
    if (!data.records || data.records.length === 0) return [];

    const valueMap = new Map<string, number>();
    data.records.forEach((record) => {
      const values = Object.values(record.data);
      values.forEach((val) => {
        if (typeof val === 'number' && val > 0) {
          const key = String(val);
          valueMap.set(key, (valueMap.get(key) || 0) + 1);
        }
      });
    });

    return Array.from(valueMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // 상위 10개만
  }, [data.records]);

  // 뱅샐현황 구조인 경우 BankStatusCharts 사용 (모든 훅 호출 후에 조건부 렌더링)
  if (shouldUseBankStatusCharts) {
    return <BankStatusCharts data={data} />;
  }

  // 월별 차트나 기존 차트 중 하나라도 있으면 표시
  const hasAnyChart = monthlyChartData.length > 0 || chartData.length > 0;
  
  if (!hasAnyChart) {
    return (
      <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
        차트를 표시할 수 있는 숫자 데이터가 없습니다.
      </div>
    );
  }

  // 금액 포맷팅 함수
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value);
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${formatAmount(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 월별 집계 차트 */}
      {monthlyChartData.length > 0 && (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-3">월별 수입/지출 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return String(value);
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="수입" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  name="수입"
                />
                <Line 
                  type="monotone" 
                  dataKey="지출" 
                  stroke="#FF8042" 
                  strokeWidth={2}
                  name="지출"
                />
                <Line 
                  type="monotone" 
                  dataKey="순수익" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="순수익"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">월별 수입/지출 합계</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return String(value);
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="수입" fill="#00C49F" name="수입" />
                <Bar dataKey="지출" fill="#FF8042" name="지출" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* 기존 차트 */}
      {chartData.length > 0 && (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-3">라인 차트</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" name="값 1" />
            {chartData.some((d) => d.value2 !== 0) && (
              <Line type="monotone" dataKey="value2" stroke="#82ca9d" name="값 2" />
            )}
            {chartData.some((d) => d.value3 !== 0) && (
              <Line type="monotone" dataKey="value3" stroke="#ffc658" name="값 3" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">바 차트</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="값 1" />
            {chartData.some((d) => d.value2 !== 0) && (
              <Bar dataKey="value2" fill="#82ca9d" name="값 2" />
            )}
            {chartData.some((d) => d.value3 !== 0) && (
              <Bar dataKey="value3" fill="#ffc658" name="값 3" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

          {pieData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">파이 차트 (상위 10개 값)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

