/**
 * GET  /api/settings/depreciations — list depreciation rules.
 * POST /api/settings/depreciations — create new depreciation rule.
 *
 * Permission: settings.read (GET), settings.update (POST).
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const rules = await prisma.depreciation.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return okResponse(rules)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const body = await req.json()
    const { name, months, depreciationType, minimumValue, notes } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Tên quy tắc khấu hao là bắt buộc.' },
        { status: 400 },
      )
    }
    if (typeof months !== 'number' || months <= 0) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Số tháng phải là số nguyên dương.' },
        { status: 400 },
      )
    }

    const existing = await prisma.depreciation.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', message: 'Tên quy tắc đã tồn tại.' },
        { status: 409 },
      )
    }

    const rule = await prisma.depreciation.create({
      data: {
        name: name.trim(),
        months,
        depreciationType: depreciationType ?? 'LINEAR',
        minimumValue: typeof minimumValue === 'number' ? new Prisma.Decimal(minimumValue) : new Prisma.Decimal(0),
        notes: notes?.trim() || null,
      },
    })

    await recordAudit(user.id, 'CREATE', 'DEPRECIATION', rule.id, `Tạo quy tắc khấu hao "${rule.name}"`)

    return okResponse(rule)
  } catch (e) {
    return errorResponse(e)
  }
}