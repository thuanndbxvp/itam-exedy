/**
 * GET /api/handover  — Danh sách handover
 * POST /api/handover — Tạo handover mới
 *
 * Sprint C.12
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { createHandover } from '@/lib/handover'
import type { HandoverAction } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    await requirePermissionApi('assets.read')

    const { searchParams } = new URL(req.url)
    const assetId = searchParams.get('assetId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action') as HandoverAction | null

    const where: Record<string, unknown> = {}
    if (assetId) where.assetId = assetId
    if (userId) where.toUserId = userId
    if (action) where.action = action

    const handovers = await prisma.assetHandover.findMany({
      where,
      include: {
        asset: {
          select: { id: true, assetTag: true, name: true },
        },
        toUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        fromUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { handoverDate: 'desc' },
      take: 100,
    })

    return okResponse({ handovers })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermissionApi('assets.update')
    const body = await req.json()

    const {
      assetId,
      action = 'HANDOVER',
      toUserId,
      fromUserId,
      toDeptId,
      toLocationId,
      accessories,
      condition,
      note,
    } = body

    if (!assetId || !toUserId) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'assetId và toUserId là bắt buộc.' },
        { status: 400 }
      )
    }

    const result = await createHandover({
      assetId,
      action,
      toUserId,
      fromUserId,
      toDeptId,
      toLocationId,
      accessories,
      condition,
      note,
      userId: actor.id,
    })

    return okResponse(result, { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}
