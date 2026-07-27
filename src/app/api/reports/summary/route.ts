import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    await requirePermissionApi('reports.view')

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

    return okResponse({
      totalAssets,
      totalUsers,
      totalLicenses,
      checkedOutAssets,
      availableAssets,
      pendingAssets,
    })
  } catch (e) {
    return errorResponse(e)
  }
}
