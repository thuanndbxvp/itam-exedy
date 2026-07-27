/**
 * StatusBarChart — Horizontal bar chart (CSS, no chart lib).
 */
interface Bar {
  statusId: string
  statusName: string
  color: string
  count: number
}

export default function StatusBarChart({ data }: { data: Bar[] }) {
  if (data.length === 0) {
    return <div className="text-sm text-gray-500 py-8 text-center">Chưa có dữ liệu.</div>
  }

  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = (d.count / max) * 100
        return (
          <div key={d.statusId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: d.color }}
                />
                {d.statusName}
              </span>
              <span className="font-semibold text-gray-900">{d.count}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
