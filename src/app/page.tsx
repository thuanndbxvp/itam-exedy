import prisma from '@/lib/prisma'
import { Monitor, CheckCircle, Activity } from 'lucide-react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardClient from '@/components/dashboard/DashboardClient'
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function DashboardPage() {
  // F10 fix (security audit): rẽ nhánh dashboard theo role.
  // EMPLOYEE → EmployeeDashboard (giao diện tối giản, không có stats toàn hệ thống hay audit log).
  // IT roles → giữ nguyên AdminDashboard với stats + audit log.
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const isEmployee = session.user.role === 'EMPLOYEE'

  if (isEmployee) {
    return <EmployeeDashboard firstName={session.user.firstName || 'bạn'} />
  }

  const recentLogs = await prisma.actionLog.findMany({
    take: 8,
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chào mừng trở lại, Admin!</h2>
          <p className="text-gray-500 mt-2">Dưới đây là tổng quan tình trạng tài sản IT của công ty hôm nay.</p>
        </div>
        <Link
          href="/assets/new"
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition shadow-sm"
        >
          + Cấp phát mới
        </Link>
      </div>

      {/* Stats + Charts */}
      <DashboardClient />

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Hoạt động gần đây</h3>
          </div>
          <Link href="/settings/audit-log" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Xem tất cả →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có hoạt động nào trong hệ thống.</div>
          ) : (
            recentLogs.map((log) => {
              const actorName = log.user
                ? `${log.user.firstName}${log.user.lastName ? ' ' + log.user.lastName : ''}`.trim()
                : 'Hệ thống'
              return (
                <div key={log.id} className="p-6 flex items-start hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0">
                    {log.actionType === 'CREATE' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : log.actionType === 'CHECKOUT' ? (
                      <Monitor className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Activity className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold text-slate-800">{actorName}</span>
                      {' đã thực hiện '}
                      <span className="font-semibold">{log.actionType}</span>
                      {log.itemId && (
                        <>
                          {' với '}
                          <span className="font-mono text-xs bg-gray-100 px-1 rounded">{log.itemId.slice(0, 12)}...</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: vi })}
                      {log.notes && ` · ${log.notes}`}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
