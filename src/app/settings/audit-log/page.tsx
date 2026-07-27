/**
 * Audit Log Viewer — F-10: xem ActionLog với filter/search.
 */
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'
import { ScrollText } from 'lucide-react'

async function getLogs(params: { actionType?: string; itemType?: string; userId?: string }) {
  return prisma.actionLog.findMany({
    where: {
      ...(params.actionType && { actionType: params.actionType as unknown as import('@prisma/client').ActionType }),
      ...(params.itemType && { itemType: params.itemType as unknown as import('@prisma/client').ItemType }),
      ...(params.userId && { userId: params.userId }),
    },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

const ACTION_TYPES = ['CREATE', 'UPDATE', 'CHECKOUT', 'CHECKIN', 'AUDIT', 'DELETE', 'NOTE_ADDED']
const ITEM_TYPES = ['ASSET', 'LICENSE', 'LICENSE_SEAT', 'USER', 'CATEGORY', 'LOCATION', 'STATUS_LABEL']

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ actionType?: string; itemType?: string }>
}) {
  try { await requireRole('ADMIN') } catch { redirect('/') }
  const sp = await searchParams
  const logs = await getLogs({ actionType: sp.actionType, itemType: sp.itemType })

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nhật ký hành động</h1>
        <p className="text-gray-500">Xem lịch sử các thao tác trên hệ thống.</p>
      </div>

      {/* Filter */}
      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hành động</label>
          <select name="actionType" defaultValue={sp.actionType ?? ''}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Tất cả</option>
            {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Loại mục tiêu</label>
          <select name="itemType" defaultValue={sp.itemType ?? ''}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Tất cả</option>
            {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          Tìm kiếm
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Chưa có nhật ký nào.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Người thực hiện</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hành động</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mục tiêu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-medium text-gray-900">
                      {[log.user.firstName, log.user.lastName].filter(Boolean).join(' ') || log.user.email}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{log.itemType} / {log.itemId.slice(0, 8)}...</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{log.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
