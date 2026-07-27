/**
 * LicenseExpiringTable — Bảng top licenses sắp hết hạn.
 */
import Link from 'next/link'
import { Calendar, Users, Clock } from 'lucide-react'

interface Row {
  licenseId: string
  name: string
  expirationDate: string
  daysUntil: number
  totalSeats: number
  usedSeats: number
}

export default function LicenseExpiringTable({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-8 text-center">
        Tuyệt vời! Không có license nào sắp hết hạn trong 60 ngày tới.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-gray-500 border-b border-gray-100">
          <tr>
            <th className="text-left py-2 pr-3">Tên phần mềm</th>
            <th className="text-left py-2 px-3">Hết hạn</th>
            <th className="text-left py-2 px-3">Còn lại</th>
            <th className="text-right py-2 pl-3">Seats</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const danger = row.daysUntil <= 14
            const warn = row.daysUntil <= 30
            return (
              <tr
                key={row.licenseId}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="py-3 pr-3 font-medium text-gray-900">
                  <Link
                    href={`/licenses/${row.licenseId}`}
                    className="hover:text-indigo-600 hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="py-3 px-3 text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(row.expirationDate).toLocaleDateString('vi-VN')}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      danger
                        ? 'bg-rose-100 text-rose-700'
                        : warn
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Clock size={12} />
                    {row.daysUntil} ngày
                  </span>
                </td>
                <td className="py-3 pl-3 text-right text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Users size={14} />
                    {row.usedSeats}/{row.totalSeats}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
