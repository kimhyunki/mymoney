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
import type { CashFlow } from '@/types';

interface CashFlowChartsProps {
  cashFlows: CashFlow[];
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#8dd1e1',
  '#d084d0',
];

export default function CashFlowCharts({ cashFlows }: CashFlowChartsProps) {
  // 수입과 지출로 분류
  const incomeItems = useMemo(
    () => cashFlows.filter((item) => item.item_type === '수입'),
    [cashFlows]
  );
  const expenseItems = useMemo(
    () => cashFlows.filter((item) => item.item_type === '지출'),
    [cashFlows]
  );

  // 모든 월 수집
  const allMonths = useMemo(() => {
    const months = new Set<string>();
    cashFlows.forEach((item) => {
      if (item.monthly_data) {
        Object.keys(item.monthly_data).forEach((month) => months.add(month));
      }
    });
    return Array.from(months).sort();
  }, [cashFlows]);

  // 월별 수입/지출 집계 데이터
  const monthlySummary = useMemo(() => {
    return allMonths.map((month) => {
      const income = incomeItems.reduce((sum, item) => {
        return sum + (item.monthly_data?.[month] || 0);
      }, 0);
      const expense = expenseItems.reduce((sum, item) => {
        return sum + (item.monthly_data?.[month] || 0);
      }, 0);
      return {
        month,
        수입: income,
        지출: expense,
        순수입: income - expense,
      };
    });
  }, [allMonths, incomeItems, expenseItems]);

  // 수입 항목별 총계 데이터
  const incomeByItem = useMemo(() => {
    return incomeItems
      .map((item) => ({
        name: item.item_name,
        총계: item.total || 0,
        월평균: item.monthly_average || 0,
      }))
      .filter((item) => item.총계 > 0)
      .sort((a, b) => b.총계 - a.총계);
  }, [incomeItems]);

  // 지출 항목별 총계 데이터
  const expenseByItem = useMemo(() => {
    return expenseItems
      .map((item) => ({
        name: item.item_name,
        총계: item.total || 0,
        월평균: item.monthly_average || 0,
      }))
      .filter((item) => item.총계 > 0)
      .sort((a, b) => b.총계 - a.총계);
  }, [expenseItems]);

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

  // Y축 포맷터
  const formatYAxis = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return String(value);
  };

  if (cashFlows.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
        현금 흐름 현황 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">현금 흐름 현황 차트</h2>

      {/* 월별 수입/지출 추이 */}
      {monthlySummary.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">월별 수입/지출 추이</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlySummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={formatYAxis} />
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
                dataKey="순수입"
                stroke="#8884d8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="순수입"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 월별 수입/지출 합계 바 차트 */}
      {monthlySummary.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">월별 수입/지출 합계</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlySummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="수입" fill="#00C49F" name="수입" />
              <Bar dataKey="지출" fill="#FF8042" name="지출" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 수입 항목별 파이 차트 */}
      {incomeByItem.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">수입 항목별 비중</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={incomeByItem}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="총계"
              >
                {incomeByItem.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 지출 항목별 파이 차트 */}
      {expenseByItem.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">지출 항목별 비중</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={expenseByItem}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="총계"
              >
                {expenseByItem.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 수입 항목별 총계 바 차트 */}
      {incomeByItem.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">수입 항목별 총계</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={incomeByItem}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="총계" fill="#00C49F" name="총계" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 지출 항목별 총계 바 차트 */}
      {expenseByItem.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">지출 항목별 총계</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={expenseByItem}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="총계" fill="#FF8042" name="총계" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 수입 항목별 월별 비교 */}
      {incomeItems.length > 0 && allMonths.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">수입 항목별 월별 비교</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={allMonths.map((month) => {
                const result: any = { month };
                incomeItems.forEach((item) => {
                  result[item.item_name] = item.monthly_data?.[month] || 0;
                });
                return result;
              })}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {incomeItems.map((item, index) => (
                <Bar
                  key={item.id}
                  dataKey={item.item_name}
                  fill={COLORS[index % COLORS.length]}
                  name={item.item_name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 지출 항목별 월별 비교 */}
      {expenseItems.length > 0 && allMonths.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">지출 항목별 월별 비교</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={allMonths.map((month) => {
                const result: any = { month };
                expenseItems.forEach((item) => {
                  result[item.item_name] = item.monthly_data?.[month] || 0;
                });
                return result;
              })}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {expenseItems.map((item, index) => (
                <Bar
                  key={item.id}
                  dataKey={item.item_name}
                  fill={COLORS[index % COLORS.length]}
                  name={item.item_name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

