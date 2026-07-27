import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
    })
    return okResponse(departments)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { name, managerId, companyId, notes } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Tên phòng ban không được trống.' },
        { status: 400 },
      )
    }
    try {
      const department = await prisma.department.create({
        data: {
          name: name.trim(),
          managerId: managerId || null,
          companyId: companyId || null,
          notes: notes || null,
        },
      })
      await recordAudit(user.id, 'CREATE', 'DEPARTMENT', department.id, `Tạo phòng ban "${department.name}"`)
      return okResponse(department, { status: 201 })
    } catch {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', message: 'Không thể tạo phòng ban.' },
        { status: 409 },
      )
    }
  } catch (e) {
    return errorResponse(e)
  }
}