/**
 * /api/licenses/[id]/targets — Hotfix License Bugs
 *
 * GET → danh sách User + Asset được gán/license cảnh báo với `hasLicense: boolean`.
 *      Frontend dùng để disabled những target ĐÃ SỞ HỮU 1 seat khác cùng licenseId.
 *
 * Auth: licenses.read.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('licenses.read')
    const { id } = await params

    const license = await prisma.license.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, name: true },
    })
    if (!license) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'License không tồn tại.' }, { status: 404 })
    }

    // Seat rows chưa xoá mềm của license này
    const seats = await prisma.licenseSeat.findMany({
      where: { licenseId: id, deletedAt: null },
      select: { assignedUserId: true, assignedAssetId: true },
    })

    const userIdsWithSeat = Array.from(
      new Set(
        seats
          .map((s) => s.assignedUserId)
          .filter((v): v is string => !!v),
      ),
    )
    const assetIdsWithSeat = Array.from(
      new Set(
        seats
          .map((s) => s.assignedAssetId)
          .filter((v): v is string => !!v),
      ),
    )

    const [users, assets] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null, activated: true },
        orderBy: { firstName: 'asc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }),
      prisma.asset.findMany({
        where: { deletedAt: null },
        orderBy: { assetTag: 'asc' },
        select: {
          id: true,
          assetTag: true,
          name: true,
        },
      }),
    ])

    const usersFlagged = users.map((u) => ({
      ...u,
      hasLicense: userIdsWithSeat.includes(u.id),
    }))
    const assetsFlagged = assets.map((a) => ({
      ...a,
      hasLicense: assetIdsWithSeat.includes(a.id),
    }))

    return okResponse({ license, users: usersFlagged, assets: assetsFlagged })
  } catch (e) {
    return errorResponse(e)
  }
}
