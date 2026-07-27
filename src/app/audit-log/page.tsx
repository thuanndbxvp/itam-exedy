import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import AuditLogTable from '@/components/reports/AuditLogTable'
import { requireRole } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'
import { ScrollText } from 'lucide-react'

const ITEMS_PER_PAGE = 20

async function getAuditLogs(params: {
  page?: string
  actionType?: string
  itemType?: string
  userId?: string
  from?: string
  to?: string
}) {
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const skip = (page - 1) * ITEMS_PER_PAGE

  const where: Record<string, unknown> = {}

  if (params.actionType) {
    where.actionType = params.actionType
  }
  if (params.itemType) {
    where.itemType = params.itemType
  }
  if (params.userId) {
    where.userId = params.userId
  }
  if (params.from || params.to) {
    where.createdAt = {}
    if (params.from) {
      (where.createdAt as Record<string, unknown>).gte = new Date(params.from)
    }
    if (params.to) {
      (where.createdAt as Record<string, unknown>).lte = new Date(params.to + 'T23:59:59')
    }
  }

  const [logsRaw, total, users] = await Promise.all([
    prisma.actionLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.actionLog.count({ where }),
    prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  // Serialize dates for client component
  const logs = logsRaw.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))

  return { logs, total, page, totalPages: Math.ceil(total / ITEMS_PER_PAGE), users }
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    actionType?: string
    itemType?: string
    userId?: string
    from?: string
    to?: string
  }>
}) {
  try {
    await requireRole('ADMIN')
  } catch {
    redirect('/')
  }

  const params = await searchParams
  const data = await getAuditLogs(params)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <ScrollText size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký hành động</h1>
        </div>
        <p className="text-gray-500">Theo dõi tất cả hoạt động trong hệ thống.</p>
      </div>

      <Suspense fallback={<div className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />}>
        <AuditLogTable
          logs={data.logs}
          users={data.users}
          currentPage={data.page}
          totalPages={data.totalPages}
          totalItems={data.total}
        />
      </Suspense>
    </div>
  )
}
