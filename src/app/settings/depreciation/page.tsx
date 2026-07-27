/**
 * Depreciation Settings — F-8: CRUD Depreciation (placeholder for Phase 2.2).
 */
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'
import { TrendingDown } from 'lucide-react'

export default async function DepreciationPage() {
  try { await requireRole('ADMIN') } catch { redirect('/') }
  const depreciations = await prisma.depreciation.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Khấu hao</h1>
          <p className="text-gray-500">Quản lý quy tắc khấu hao tài sản.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium opacity-50 cursor-not-allowed" disabled>
          + Thêm quy tắc
        </button>
      </div>

      {depreciations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <TrendingDown size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Chưa có quy tắc khấu hao nào.</p>
          <p className="text-xs text-gray-400 mt-2">Tính năng sẽ được phát triển ở Phase tiếp theo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Số tháng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {depreciations.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 text-gray-600">{d.months} tháng</td>
                  <td className="px-6 py-4 text-gray-600">{d.depreciationType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
