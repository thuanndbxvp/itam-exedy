import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

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

  return NextResponse.json({ ok: true, data: result })
}
