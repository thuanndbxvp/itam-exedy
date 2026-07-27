import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    // F3 fix (security audit): gate reports.view.
    await requirePermissionApi('reports.view')

    const data = await prisma.asset.groupBy({
      by: ['statusId'],
      where: { deletedAt: null },
      _count: { id: true },
    })

    const statuses = await prisma.statusLabel.findMany({
      where: { id: { in: data.map((d) => d.statusId) } },
      select: { id: true, name: true, color: true, deployable: true, pending: true, archived: true },
    })

    const result = data.map((d) => {
      const status = statuses.find((s) => s.id === d.statusId)
      return {
        statusId: d.statusId,
        statusName: status?.name ?? 'Unknown',
        color: status?.color ?? '#6b7280',
        deployable: status?.deployable ?? false,
        pending: status?.pending ?? false,
        archived: status?.archived ?? false,
        count: d._count.id,
      }
    })

    return okResponse(result)
  } catch (e) {
    return errorResponse(e)
  }
}
