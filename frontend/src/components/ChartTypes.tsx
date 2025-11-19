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

interface ChartTypesProps {
  data: SheetWithData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ChartTypes({ data }: ChartTypesProps) {
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

  if (chartData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
        차트를 표시할 수 있는 숫자 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
}

