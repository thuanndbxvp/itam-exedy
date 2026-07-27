import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function GET() {
  try {
    await requirePermissionApi('users.read')
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, firstName: true, lastName: true, username: true, email: true,
        employeeNum: true, jobTitle: true, phone: true, mobile: true,
        address: true, city: true, state: true, country: true, zip: true,
        notes: true, avatar: true, activated: true, role: true, customRoleId: true,
        companyId: true, departmentId: true, locationId: true, managerId: true,
        twoFactorEnrolled: true, twoFactorOptin: true, locale: true,
        remote: true, vip: true, autoassignLicenses: true,
        createdAt: true, updatedAt: true, deletedAt: true,
        department: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        // EXCLUDE: password, twoFactorSecret — F16 fix
      },
    })
    return okResponse(users)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('users.create')
    const { firstName, lastName, email, password, role, departmentId, jobTitle, customRoleId } = await req.json()

    if (!firstName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Thông tin không đầy đủ.' },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', message: 'Email đã tồn tại.' },
        { status: 409 },
      )
    }

    const created = await prisma.user.create({
      data: {
        firstName,
        lastName: lastName || null,
        email,
        password,
        role: role || 'EMPLOYEE',
        jobTitle: jobTitle || null,
        departmentId: departmentId || null,
        customRoleId: customRoleId || null,
        activated: true,
      },
      select: {
        id: true, firstName: true, lastName: true, username: true, email: true,
        employeeNum: true, jobTitle: true, phone: true, mobile: true,
        address: true, city: true, state: true, country: true, zip: true,
        avatar: true, activated: true, role: true, customRoleId: true,
        companyId: true, departmentId: true, locationId: true, managerId: true,
        twoFactorEnrolled: true, twoFactorOptin: true, locale: true,
        remote: true, vip: true, autoassignLicenses: true,
        createdAt: true, updatedAt: true, deletedAt: true,
        // EXCLUDE: password, twoFactorSecret — F16 fix
      },
    })
    await recordAudit(user.id, 'CREATE', 'USER', created.id, `Tạo người dùng "${[firstName, created.lastName].filter(Boolean).join(' ')}"`, {
      newValues: { firstName, lastName, email, role: created.role, departmentId: created.departmentId },
    })
    return okResponse(created, { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}