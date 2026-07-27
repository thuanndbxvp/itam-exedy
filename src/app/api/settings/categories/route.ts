import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    return okResponse(cats)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const {
      name, categoryType, color,
      eulaText, requireAcceptance, checkinEmail,
    } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên không được trống.' }, { status: 400 })
    }
    const cat = await prisma.category.create({
      data: {
        name,
        categoryType: categoryType || 'ASSET',
        color: color || null,
        eulaText: eulaText?.trim() || null,
        requireAcceptance: !!requireAcceptance,
        checkinEmail: checkinEmail?.trim() || null,
      },
    })
    await recordAudit(user.id, 'CREATE', 'CATEGORY', cat.id, `Tạo danh mục "${name}"`)
    return okResponse(cat, { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}