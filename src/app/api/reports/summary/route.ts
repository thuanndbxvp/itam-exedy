import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const [totalAssets, totalUsers, totalLicenses, checkedOutAssets, availableAssets, pendingAssets] =
    await Promise.all([
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.license.count({ where: { deletedAt: null } }),
      prisma.asset.count({ where: { deletedAt: null, assignedUserId: { not: null } } }),
      prisma.asset.count({
        where: {
          deletedAt: null,
          status: { deployable: true, pending: false, archived: false },
        },
      }),
      prisma.asset.count({
        where: { deletedAt: null, status: { pending: true } },
      }),
    ])

  return NextResponse.json({
    ok: true,
    data: {
      totalAssets,
      totalUsers,
      totalLicenses,
      checkedOutAssets,
      availableAssets,
      pendingAssets,
    },
  })
}
