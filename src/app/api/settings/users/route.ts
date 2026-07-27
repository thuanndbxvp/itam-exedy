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
    const {
      firstName, lastName, email, password, role, departmentId, jobTitle, customRoleId,
      username, employeeNum, phone, mobile, address, city, state, country, zip,
      notes, avatar, activated,
      companyId, locationId, managerId, locale, remote, vip, autoassignLicenses,
    } = await req.json()

    if (!firstName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Thông tin không đầy đủ.' },
        { status: 400 },
      )
    }

    const nullable = (v: unknown): string | null => {
      if (v === '' || v === undefined) return null
      return v as string
    }

    // Pre-check unique constraints để trả 409 thay vì Prisma P2002
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', message: 'Email đã tồn tại.' },
        { status: 409 },
      )
    }
    const normalizedUsername = nullable(username) as string | null
    if (normalizedUsername) {
      const existingUsername = await prisma.user.findUnique({ where: { username: normalizedUsername } })
      if (existingUsername) {
        return NextResponse.json(
          { ok: false, code: 'CONFLICT', message: 'Username đã tồn tại.' },
          { status: 409 },
        )
      }
    }
    const normalizedEmployeeNum = nullable(employeeNum) as string | null
    if (normalizedEmployeeNum) {
      const existingEmp = await prisma.user.findUnique({ where: { employeeNum: normalizedEmployeeNum } })
      if (existingEmp) {
        return NextResponse.json(
          { ok: false, code: 'CONFLICT', message: 'Mã nhân viên đã tồn tại.' },
          { status: 409 },
        )
      }
    }

    const created = await prisma.user.create({
      data: {
        firstName,
        lastName: nullable(lastName),
        username: normalizedUsername,
        email,
        password,
        employeeNum: normalizedEmployeeNum,
        role: role || 'EMPLOYEE',
        jobTitle: nullable(jobTitle),
        phone: nullable(phone),
        mobile: nullable(mobile),
        address: nullable(address),
        city: nullable(city),
        state: nullable(state),
        country: nullable(country),
        zip: nullable(zip),
        notes: nullable(notes),
        avatar: nullable(avatar),
        activated: typeof activated === 'boolean' ? activated : true,
        departmentId: nullable(departmentId),
        customRoleId: nullable(customRoleId),
        companyId: nullable(companyId),
        locationId: nullable(locationId),
        managerId: nullable(managerId),
        locale: locale || 'vi-VN',
        remote: typeof remote === 'boolean' ? remote : false,
        vip: typeof vip === 'boolean' ? vip : false,
        autoassignLicenses: typeof autoassignLicenses === 'boolean' ? autoassignLicenses : false,
      },
      select: {
        id: true, firstName: true, lastName: true, username: true, email: true,
        employeeNum: true, jobTitle: true, phone: true, mobile: true,
        address: true, city: true, state: true, country: true, zip: true,
        notes: true, avatar: true, activated: true, role: true, customRoleId: true,
        companyId: true, departmentId: true, locationId: true, managerId: true,
        twoFactorEnrolled: true, twoFactorOptin: true, locale: true,
        remote: true, vip: true, autoassignLicenses: true,
        createdAt: true, updatedAt: true, deletedAt: true,
        // EXCLUDE: password, twoFactorSecret — F16 fix
      },
    })
    await recordAudit(user.id, 'CREATE', 'USER', created.id, `Tạo người dùng "${[firstName, created.lastName].filter(Boolean).join(' ')}"`, {
      newValues: {
        firstName, lastName, email, role: created.role, departmentId: created.departmentId,
        activated: created.activated, jobTitle: created.jobTitle,
      },
    })
    return okResponse(created, { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}