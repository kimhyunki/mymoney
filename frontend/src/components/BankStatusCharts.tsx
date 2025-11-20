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
import {
  parseCashFlow,
  parseFinancialStatus,
  parseInsuranceStatus,
  parseInvestmentStatus,
  parseLoanStatus,
} from '@/utils/bankStatusParser';

interface BankStatusChartsProps {
  data: SheetWithData;
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

export default function BankStatusCharts({ data }: BankStatusChartsProps) {
  const cashFlowData = useMemo(() => parseCashFlow(data), [data]);
  const financialData = useMemo(() => parseFinancialStatus(data), [data]);
  const insuranceData = useMemo(() => parseInsuranceStatus(data), [data]);
  const investmentData = useMemo(() => parseInvestmentStatus(data), [data]);
  const loanData = useMemo(() => parseLoanStatus(data), [data]);

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

  return (
    <div className="space-y-8">
      {/* 현금흐름현황 차트 */}
      {cashFlowData && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">현금흐름현황</h2>

          {/* 월별 수입/지출 추이 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">월별 수입/지출 추이</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={cashFlowData.months.map((month) => {
                  const income = cashFlowData.income.reduce(
                    (sum, item) => sum + (item.monthlyData[month] || 0),
                    0
                  );
                  const expense = cashFlowData.expense.reduce(
                    (sum, item) => sum + (item.monthlyData[month] || 0),
                    0
                  );
                  return {
                    month,
                    수입: income,
                    지출: expense,
                    순수입: income - expense,
                  };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="수입" stroke="#00C49F" strokeWidth={2} name="수입" />
                <Line type="monotone" dataKey="지출" stroke="#FF8042" strokeWidth={2} name="지출" />
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

          {/* 수입 항목별 월별 비교 */}
          {cashFlowData.income.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">수입 항목별 월별 비교</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={cashFlowData.months.map((month) => {
                    const result: any = { month };
                    cashFlowData.income.forEach((item) => {
                      result[item.name] = item.monthlyData[month] || 0;
                    });
                    return result;
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {cashFlowData.income.map((item, index) => (
                    <Bar
                      key={item.name}
                      dataKey={item.name}
                      fill={COLORS[index % COLORS.length]}
                      name={item.name}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 지출 항목별 월별 비교 */}
          {cashFlowData.expense.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">지출 항목별 월별 비교</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={cashFlowData.months.map((month) => {
                    const result: any = { month };
                    cashFlowData.expense.forEach((item) => {
                      result[item.name] = item.monthlyData[month] || 0;
                    });
                    return result;
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {cashFlowData.expense.map((item, index) => (
                    <Bar
                      key={item.name}
                      dataKey={item.name}
                      fill={COLORS[index % COLORS.length]}
                      name={item.name}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* 재무현황 차트 */}
      {financialData && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">재무현황</h2>

          {/* 자산 구성 파이 차트 */}
          {financialData.assets.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">자산 구성 (카테고리별)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      financialData.assets.reduce((acc, item) => {
                        acc[item.category] = (acc[item.category] || 0) + item.amount;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .map(([name, value]) => ({ name, value }))
                      .filter((item) => item.value > 0)
                      .sort((a, b) => b.value - a.value)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(
                      financialData.assets.reduce((acc, item) => {
                        acc[item.category] = (acc[item.category] || 0) + item.amount;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .map(([name, value]) => ({ name, value }))
                      .filter((item) => item.value > 0)
                      .map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 자산 항목별 바 차트 (상위 10개) */}
          {financialData.assets.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">자산 항목별 금액 (상위 10개)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={financialData.assets
                    .filter((item) => item.amount > 0)
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 10)
                    .map((item) => ({
                      name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
                      금액: item.amount,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="금액" fill="#8884d8" name="금액" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 부채 항목별 바 차트 */}
          {financialData.liabilities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">부채 항목별 금액</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={financialData.liabilities
                    .filter((item) => item.amount > 0)
                    .map((item) => ({
                      name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
                      금액: item.amount,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="금액" fill="#FF8042" name="금액" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* 보험현황 차트 */}
      {insuranceData && insuranceData.items.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">보험현황</h2>

          {/* 금융사별 납입금 파이 차트 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">금융사별 납입금</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={Object.entries(
                    insuranceData.items.reduce((acc, item) => {
                      acc[item.company] = (acc[item.company] || 0) + item.totalPaid;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .map(([name, value]) => ({ name, value }))
                    .filter((item) => item.value > 0)
                    .sort((a, b) => b.value - a.value)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(
                    insuranceData.items.reduce((acc, item) => {
                      acc[item.company] = (acc[item.company] || 0) + item.totalPaid;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .map(([name, value]) => ({ name, value }))
                    .filter((item) => item.value > 0)
                    .map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 보험별 납입금 바 차트 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">보험별 납입금</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={insuranceData.items
                  .filter((item) => item.totalPaid > 0)
                  .sort((a, b) => b.totalPaid - a.totalPaid)
                  .slice(0, 10)
                  .map((item) => ({
                    name: item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name,
                    납입금: item.totalPaid,
                  }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                <YAxis tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="납입금" fill="#00C49F" name="납입금" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 투자현황 차트 */}
      {investmentData && investmentData.items.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">투자현황</h2>

          {/* 투자 상품별 비중 파이 차트 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">투자 상품별 비중 (평가금액 기준)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={investmentData.items
                    .filter((item) => item.currentValue > 0)
                    .sort((a, b) => b.currentValue - a.currentValue)
                    .slice(0, 10)
                    .map((item) => ({
                      name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
                      value: item.currentValue,
                    }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {investmentData.items
                    .filter((item) => item.currentValue > 0)
                    .sort((a, b) => b.currentValue - a.currentValue)
                    .slice(0, 10)
                    .map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 수익률 비교 바 차트 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">수익률 비교</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={investmentData.items
                  .sort((a, b) => b.returnRate - a.returnRate)
                  .map((item) => ({
                    name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
                    수익률: item.returnRate,
                    color: item.returnRate >= 0 ? '#00C49F' : '#FF8042',
                  }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                          <p className="font-semibold mb-2">{payload[0].payload.name}</p>
                          <p style={{ color: payload[0].color }} className="text-sm">
                            {`수익률: ${payload[0].value?.toFixed(2)}%`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="수익률" name="수익률">
                  {investmentData.items
                    .sort((a, b) => b.returnRate - a.returnRate)
                    .map((item, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={item.returnRate >= 0 ? '#00C49F' : '#FF8042'}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 원금 vs 평가금액 비교 스택 바 차트 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">원금 vs 평가금액 비교</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={investmentData.items
                  .filter((item) => item.principal > 0 || item.currentValue > 0)
                  .sort((a, b) => b.currentValue - a.currentValue)
                  .slice(0, 10)
                  .map((item) => ({
                    name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
                    원금: item.principal,
                    평가금액: item.currentValue,
                  }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="원금" fill="#8884d8" name="원금" />
                <Bar dataKey="평가금액" fill="#00C49F" name="평가금액" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 대출현황 차트 */}
      {loanData && loanData.items.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">대출현황</h2>

          {/* 대출 잔액 바 차트 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">대출 잔액</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={loanData.items
                  .filter((item) => item.balance > 0)
                  .map((item) => ({
                    name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
                    잔액: item.balance,
                  }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="잔액" fill="#FF8042" name="잔액" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 대출 종류별 비중 파이 차트 */}
          {loanData.items.length > 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">대출 종류별 비중</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      loanData.items.reduce((acc, item) => {
                        acc[item.type] = (acc[item.type] || 0) + item.balance;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .map(([name, value]) => ({ name, value }))
                      .filter((item) => item.value > 0)
                      .sort((a, b) => b.value - a.value)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(
                      loanData.items.reduce((acc, item) => {
                        acc[item.type] = (acc[item.type] || 0) + item.balance;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .map(([name, value]) => ({ name, value }))
                      .filter((item) => item.value > 0)
                      .map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* 데이터가 없는 경우 */}
      {!cashFlowData && !financialData && (!insuranceData || insuranceData.items.length === 0) && (!investmentData || investmentData.items.length === 0) && (!loanData || loanData.items.length === 0) && (
        <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
          뱅샐현황 데이터를 파싱할 수 없습니다.
        </div>
      )}
    </div>
  );
}

