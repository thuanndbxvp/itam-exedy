import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Filter, MoreVertical, Key, Edit2, Trash2, Archive, ExternalLink } from 'lucide-react'

export default async function LicensesPage() {
  // Load kèm `seats` relation để đếm số LicenseSeat hiện có (Count via include).
  // Nếu include seats, Prisma sẽ chạy 1 query riêng cho seats — N+1 chỉ xảy ra nếu loop `lic.seats`.
  // Ở đây chỉ đọc `seats.length` nên OK.
  const licenses = await prisma.license.findMany({
    include: { seats: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm tên phần mềm, Product Key..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 shadow-sm transition">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <Link
          href="/licenses/new"
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition shadow-sm font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Bản Quyền</span>
        </Link>
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-500">
                <th className="px-6 py-4 font-medium whitespace-nowrap">Tên Phần mềm</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Product Key</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-center">Tổng License (Seats)</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Ngày tạo</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Archive className="w-10 h-10 text-gray-300" />
                      <p>Chưa có bản quyền phần mềm nào. Hãy thêm mới!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                licenses.map(lic => (
                  <tr key={lic.id} className="hover:bg-slate-50/50 transition group">
                    {/* Cột 1 — Epic D: bọc tên license thành Link tới /licenses/[id] */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/licenses/${lic.id}`}
                        className="flex items-center space-x-3 group/link"
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover/link:bg-indigo-100 transition">
                          <Key className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 group-hover/link:text-indigo-600 transition-colors flex items-center space-x-1">
                          <span>{lic.name}</span>
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition" />
                        </p>
                      </Link>
                    </td>

                    {/* Cột 2 — giữ nguyên */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {lic.productKey || 'Không áp dụng'}
                      </span>
                    </td>

                    {/* Cột 3 — ĐỔI từ seatsTotal → seats.length */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full bg-slate-100 font-bold text-slate-700">
                        {lic.seats?.length ?? 0}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        tổng ghế
                      </p>
                    </td>

                    {/* Cột 4 — giữ nguyên */}
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(lic.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Cột 5 */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/licenses/${lic.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/licenses/${lic.id}`}
                          className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                          title="Chi tiết"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Hiển thị <span className="font-medium text-gray-900">{licenses.length}</span> bản quyền
          </span>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm" disabled>Trước</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm" disabled>Sau</button>
          </div>
        </div>
      </div>
    </div>
  )
}
