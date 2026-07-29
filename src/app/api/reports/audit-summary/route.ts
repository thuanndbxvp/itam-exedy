/**
 * GET /api/reports/audit-summary — Audit Report data
 *
 * Auth: reports.view (ADMIN, IT_MANAGER)
 *
 * Sprint C.12 - Audit Report
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
      session.user.role === 'IT_MANAGER'

    if (!isPrivileged) {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueSoonThreshold = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Count assets by audit status
    const [overdue, dueSoon, safe] = await Promise.all([
      // Overdue: nextAuditDate < today
      prisma.asset.count({
        where: {
          deletedAt: null,
          nextAuditDate: { not: null, lt: today },
        },
      }),
      // Due Soon: nextAuditDate >= today && <= today + 30 days
      prisma.asset.count({
        where: {
          deletedAt: null,
          nextAuditDate: { not: null, gte: today, lte: dueSoonThreshold },
        },
      }),
      // Safe: nextAuditDate > today + 30 days || nextAuditDate is null
      prisma.asset.count({
        where: {
          deletedAt: null,
          OR: [
            { nextAuditDate: null },
            { nextAuditDate: { gt: dueSoonThreshold } },
          ],
        },
      }),
    ])

    // Get assets that are Overdue or Due Soon for the table
    const assetsDueForAudit = await prisma.asset.findMany({
      where: {
        deletedAt: null,
        OR: [
          // Overdue
          { nextAuditDate: { not: null, lt: today } },
          // Due Soon
          { nextAuditDate: { not: null, gte: today, lte: dueSoonThreshold } },
        ],
      },
      orderBy: { nextAuditDate: 'asc' },
      select: {
        id: true,
        assetTag: true,
        name: true,
        nextAuditDate: true,
        lastAuditDate: true,
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return okResponse({
      counters: { overdue, dueSoon, safe },
      assets: assetsDueForAudit.map(a => ({
        id: a.id,
        assetTag: a.assetTag,
        name: a.name,
        nextAuditDate: a.nextAuditDate?.toISOString() ?? null,
        lastAuditDate: a.lastAuditDate?.toISOString() ?? null,
        status: a.nextAuditDate && new Date(a.nextAuditDate) < today ? 'overdue' : 'due_soon',
        assignedUser: a.assignedUser ? {
          id: a.assignedUser.id,
          name: [a.assignedUser.firstName, a.assignedUser.lastName].filter(Boolean).join(' '),
          email: a.assignedUser.email,
        } : null,
      })),
    })
  } catch (e) {
    return errorResponse(e)
  }
}
