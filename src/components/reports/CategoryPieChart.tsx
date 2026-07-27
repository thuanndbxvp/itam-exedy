/**
 * CategoryPieChart — Donut chart (SVG, no chart lib).
 *
 * Simple SVG donut với legend.
 */
interface Slice {
  categoryId: string
  categoryName: string
  color: string
  count: number
}

export default function CategoryPieChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  if (total === 0) {
    return <div className="text-sm text-gray-500 py-8 text-center">Chưa có dữ liệu.</div>
  }

  // Compute donut slices
  const radius = 80
  const circumference = 2 * Math.PI * radius
  // Build slices with cumulative offsets via reduce (immutable).
  const slices = data.reduce<Array<Slice & { pct: number; dash: number; dashOffset: number; acc: number }>>(
    (acc, d) => {
      const pct = d.count / total
      const dash = circumference * pct
      const accPct = acc.length === 0 ? 0 : acc[acc.length - 1].acc + acc[acc.length - 1].pct
      acc.push({ ...d, pct, dash, dashOffset: circumference * (1 - pct), acc: accPct })
      return acc
    },
    []
  )

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        className="transform -rotate-90"
      >
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="32"
        />
        {slices.map((s) => (
          <circle
            key={s.categoryId}
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="32"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-circumference * s.acc}
          >
            <title>
              {s.categoryName}: {s.count} ({(s.pct * 100).toFixed(1)}%)
            </title>
          </circle>
        ))}
        {/* Inner label */}
        <g transform="rotate(90 90 90)">
          <text
            x="90"
            y="86"
            textAnchor="middle"
            className="text-2xl font-bold"
            fill="#111827"
            style={{ fontSize: 24, fontWeight: 700 }}
          >
            {total}
          </text>
          <text
            x="90"
            y="106"
            textAnchor="middle"
            fill="#6b7280"
            style={{ fontSize: 12 }}
          >
            tổng
          </text>
        </g>
      </svg>

      <ul className="space-y-1.5 flex-1 w-full">
        {slices.slice(0, 8).map((s) => (
          <li
            key={s.categoryId}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 text-gray-700">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {s.categoryName}
            </span>
            <span className="font-medium text-gray-900">
              {s.count} ({(s.pct * 100).toFixed(0)}%)
            </span>
          </li>
        ))}
        {slices.length > 8 && (
          <li className="text-xs text-gray-400 pt-1">
            +{slices.length - 8} danh mục khác
          </li>
        )}
      </ul>
    </div>
  )
}
