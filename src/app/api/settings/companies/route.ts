import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } })
    return okResponse(companies)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { name, notes } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên không được trống.' }, { status: 400 })
    }
    try {
      const company = await prisma.company.create({ data: { name, notes: notes || null } })
      await recordAudit(user.id, 'CREATE', 'COMPANY', company.id, `Tạo công ty "${name}"`)
      return okResponse(company, { status: 201 })
    } catch {
      return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Tên công ty đã tồn tại.' }, { status: 409 })
    }
  } catch (e) {
    return errorResponse(e)
  }
}