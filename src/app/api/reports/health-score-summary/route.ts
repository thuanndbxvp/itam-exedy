/**
 * GET /api/reports/health-score-summary — Health Score distribution cho Dashboard
 *
 * Auth: assets.read.
 *
 * Sprint C.11
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
    }

    // Chỉ IT roles mới xem được
    const isPrivileged =
      session.user.role === 'ADMIN' ||
      session.user.role === 'IT_MANAGER' ||
      session.user.role === 'IT_STAFF'

    if (!isPrivileged) {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }, { status: 403 })
    }

    // Query với company filter nếu có
    const companyFilter = session.user.companyId ? { companyId: session.user.companyId } : {}

    const [excellent, good, fair, poor, total, needsReplacement] = await Promise.all([
      // Excellent: 85-100
      prisma.asset.count({
        where: { ...companyFilter, deletedAt: null, healthScore: { gte: 85 } }
      }),
      // Good: 70-84
      prisma.asset.count({
        where: { ...companyFilter, deletedAt: null, healthScore: { gte: 70, lt: 85 } }
      }),
      // Fair: 50-69
      prisma.asset.count({
        where: { ...companyFilter, deletedAt: null, healthScore: { gte: 50, lt: 70 } }
      }),
      // Poor: 0-49
      prisma.asset.count({
        where: { ...companyFilter, deletedAt: null, healthScore: { lt: 50 } }
      }),
      // Total assets
      prisma.asset.count({
        where: { ...companyFilter, deletedAt: null }
      }),
      // Needs replacement: score < 50 hoặc chưa calculate
      prisma.asset.count({
        where: {
          ...companyFilter,
          deletedAt: null,
          OR: [
            { healthScore: { lt: 50 } },
            { healthScore: null },
          ],
        },
      }),
    ])

    // Top assets cần thay thế
    const topReplacementCandidates = await prisma.asset.findMany({
      where: {
        ...companyFilter,
        deletedAt: null,
        healthScore: { lt: 60 },
        healthScore: { not: null },
      },
      orderBy: { healthScore: 'asc' },
      take: 5,
      select: {
        id: true,
        assetTag: true,
        name: true,
        healthScore: true,
        repairCount: true,
        purchaseDate: true,
      },
    })

    // Calculate average score
    const avgScoreResult = await prisma.asset.aggregate({
      where: { ...companyFilter, deletedAt: null, healthScore: { not: null } },
      _avg: { healthScore: true },
    })
    const avgScore = avgScoreResult._avg.healthScore
      ? Math.round(avgScoreResult._avg.healthScore)
      : null

    return okResponse({
      distribution: {
        excellent,
        good,
        fair,
        poor,
        total,
      },
      avgScore,
      needsReplacement,
      topReplacementCandidates: topReplacementCandidates.map(a => ({
        id: a.id,
        assetTag: a.assetTag,
        name: a.name,
        healthScore: a.healthScore,
        repairCount: a.repairCount,
        purchaseDate: a.purchaseDate?.toISOString() ?? null,
      })),
    })
  } catch (e) {
    return errorResponse(e)
  }
}
