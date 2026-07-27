'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface StatusData {
  statusId: string
  statusName: string
  color: string
  count: number
}

const DEFAULT_COLORS = [
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6b7280',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
]

interface StatusPieChartProps {
  data: StatusData[]
}

export default function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    fill: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Không có dữ liệu
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tài sản theo trạng thái</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="count"
            nameKey="statusName"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value ?? 0} tài sản`, 'Số lượng']} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
