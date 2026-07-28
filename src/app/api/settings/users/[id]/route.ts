import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { errorResponse, okResponse } from '@/lib/api'
import { invalidatePermissionCache } from '@/lib/permissions'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('users.read')
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
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
        // EXCLUDE: password, twoFactorSecret
      },
    })
    if (!user) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    return okResponse(user)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('users.update')
    const { id } = await params
    const body = await req.json()
    const {
      firstName,
      lastName,
      jobTitle,
      email,
      username,
      employeeNum,
      phone,
      mobile,
      address,
      city,
      state,
      country,
      zip,
      notes,
      avatar,
      activated,
      // R.1: Remove password from here - use dedicated change-password endpoint
      // password,
      role,
      departmentId,
      customRoleId,
      companyId,
      locationId,
      managerId,
      locale,
      remote,
      vip,
      autoassignLicenses,
    } = body

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }

    // R.1: Actor check - prevent privilege escalation
    // Self-edit: actor.id === id
    // Admin-edit: actor must have higher or equal role
    const isSelf = actor.id === id
    const isPrivileged = actor.role === 'ADMIN' || actor.role === 'IT_MANAGER'

    if (!isSelf && !isPrivileged) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền sửa profile người dùng khác. Chỉ IT Manager hoặc Admin mới có thể thực hiện.',
        },
        { status: 403 }
      )
    }

    // R.1: IT_STAFF can only edit EMPLOYEE users (not other IT_STAFF or IT_MANAGER)
    if (actor.role === 'IT_STAFF' && !isSelf) {
      const targetRole = existing.role
      if (targetRole !== 'EMPLOYEE') {
        return NextResponse.json(
          {
            ok: false,
            code: 'FORBIDDEN',
            message: 'Bạn chỉ có thể sửa thông tin nhân viên (EMPLOYEE).',
          },
          { status: 403 }
        )
      }
    }

    // F1 fix (security audit): role + customRoleId thay đổi đòi hỏi quyền users.manage_roles.
    // users.update chỉ cho phép sửa thông tin cá nhân (tên, job title, dept).
    if (role !== undefined || customRoleId !== undefined) {
      await requirePermissionApi('users.manage_roles')
    }

    // R.1: Remove password update from here - it should use dedicated change-password endpoint
    // Security: preventing privilege escalation via password change
    if (body.password !== undefined) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_REQUEST',
          message: 'Không thể đổi mật khẩu qua endpoint này. Vui lòng sử dụng chức năng đổi mật khẩu riêng.',
        },
        { status: 400 }
      )
    }

    /**
     * Helper: empty string → null (cho optional FK + string fields).
     * Tránh Prisma set empty string thay vì null, gây lỗi FK constraint hoặc
     * empty username/email không hợp lệ với unique index.
     */
    const nullable = (v: unknown): unknown => {
      if (v === '' || v === undefined) return null
      return v
    }

    const updateData: Record<string, unknown> = {}
    if (firstName) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = nullable(lastName)
    if (jobTitle !== undefined) updateData.jobTitle = nullable(jobTitle)
    if (role) updateData.role = role
    if (departmentId !== undefined) updateData.departmentId = nullable(departmentId)
    if (customRoleId !== undefined) updateData.customRoleId = nullable(customRoleId)
    if (companyId !== undefined) updateData.companyId = nullable(companyId)
    if (locationId !== undefined) updateData.locationId = nullable(locationId)
    if (managerId !== undefined) updateData.managerId = nullable(managerId)
    if (username !== undefined) updateData.username = nullable(username)
    if (employeeNum !== undefined) updateData.employeeNum = nullable(employeeNum)
    if (phone !== undefined) updateData.phone = nullable(phone)
    if (mobile !== undefined) updateData.mobile = nullable(mobile)
    if (address !== undefined) updateData.address = nullable(address)
    if (city !== undefined) updateData.city = nullable(city)
    if (state !== undefined) updateData.state = nullable(state)
    if (country !== undefined) updateData.country = nullable(country)
    if (zip !== undefined) updateData.zip = nullable(zip)
    if (notes !== undefined) updateData.notes = nullable(notes)
    if (avatar !== undefined) updateData.avatar = nullable(avatar)
    if (typeof activated === 'boolean') updateData.activated = activated
    if (typeof remote === 'boolean') updateData.remote = remote
    if (typeof vip === 'boolean') updateData.vip = vip
    if (typeof autoassignLicenses === 'boolean') updateData.autoassignLicenses = autoassignLicenses
    if (locale !== undefined && typeof locale === 'string' && locale.length > 0) updateData.locale = locale

    if (email && email !== existing.email) {
      const conflict = await prisma.user.findUnique({ where: { email } })
      if (conflict) {
        return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Email đã tồn tại.' }, { status: 409 })
      }
      updateData.email = email
    }
    // A3: unique validation cho username — P2002 là Prisma unique violation code
    if (username && username !== existing.username) {
      const conflict = await prisma.user.findUnique({ where: { username } })
      if (conflict) {
        return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Username đã tồn tại.' }, { status: 409 })
      }
      updateData.username = username
    }
    if (employeeNum && employeeNum !== existing.employeeNum) {
      const conflict = await prisma.user.findUnique({ where: { employeeNum } })
      if (conflict) {
        return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Mã nhân viên đã tồn tại.' }, { status: 409 })
      }
      updateData.employeeNum = employeeNum
    }
    // R.1: Password update removed - use dedicated change-password endpoint
    // if (password) updateData.password = await bcrypt.hash(password, 10)

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, firstName: true, lastName: true, username: true, email: true,
        employeeNum: true, jobTitle: true, phone: true, mobile: true,
        address: true, city: true, state: true, country: true, zip: true,
        notes: true, avatar: true, activated: true, role: true, customRoleId: true,
        companyId: true, departmentId: true, locationId: true, managerId: true,
        twoFactorEnrolled: true, twoFactorOptin: true, locale: true,
        remote: true, vip: true, autoassignLicenses: true,
        createdAt: true, updatedAt: true, deletedAt: true,
        // EXCLUDE: password, twoFactorSecret
      },
    })
    invalidatePermissionCache(id)

    // Audit — KHÔNG ghi password (chỉ note "đã đổi mật khẩu" nếu có).
    const name = [updated.firstName, updated.lastName].filter(Boolean).join(' ')
    await recordAudit(
      actor.id,
      'UPDATE',
      'USER',
      id,
      `Cập nhật người dùng "${name}"${password ? ' (đổi mật khẩu)' : ''}`,
      {
        oldValues: {
          firstName: existing.firstName, lastName: existing.lastName, email: existing.email,
          role: existing.role, departmentId: existing.departmentId,
          activated: existing.activated, jobTitle: existing.jobTitle,
        },
        newValues: {
          firstName: updated.firstName, lastName: updated.lastName, email: updated.email,
          role: updated.role, departmentId: updated.departmentId,
          activated: updated.activated, jobTitle: updated.jobTitle,
        },
      },
    )

    return okResponse(updated)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('users.delete')
    const { id } = await params

    // Self-delete protection
    if (actor.id === id) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: 'Bạn không thể tự xóa tài khoản của mình.' },
        { status: 400 },
      )
    }

    // System user protection
    if (id === 'system') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: 'Không thể xóa tài khoản hệ thống.' },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy người dùng.' },
        { status: 404 },
      )
    }

    // Prevent double-delete
    if (existing.deletedAt) {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', message: 'Người dùng đã bị xóa trước đó.' },
        { status: 409 },
      )
    }

    // Get system user ID for reassignment
    const systemUser = await prisma.user.findUnique({ where: { username: 'system' } })
    const systemUserId = systemUser?.id

    const name = [existing.firstName, existing.lastName].filter(Boolean).join(' ') || (existing.email ?? id)

    // Phase 1: detach / reassign all nullable FKs (parallel)
    await Promise.all([
      // Assets assigned to this user → unassigned
      prisma.asset.updateMany({
        where: { assignedUserId: id },
        data: { assignedUserId: null },
      }),
      // License seats assigned to this user → unassigned
      prisma.licenseSeat.updateMany({
        where: { assignedUserId: id },
        data: { assignedUserId: null },
      }),
      // Tickets where this user is assignee → unassigned
      prisma.ticket.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      }),
      // Asset maintenance records created by this user → null creator
      prisma.assetMaintenance.updateMany({
        where: { createdById: id },
        data: { createdById: null },
      }),
    ])

    // Phase 2: reassign system-owned FKs to system user (must exist)
    if (systemUserId) {
      await Promise.all([
        // Tickets reported by this user → reassign to system
        prisma.ticket.updateMany({
          where: { reporterId: id },
          data: { reporterId: systemUserId },
        }),
        // Tickets closed by this user → reassign to system
        prisma.ticket.updateMany({
          where: { closedById: id },
          data: { closedById: systemUserId },
        }),
        // Ticket comments by this user → reassign to system (preserve audit)
        prisma.ticketComment.updateMany({
          where: { authorId: id },
          data: { authorId: systemUserId },
        }),
        // Ticket attachments uploaded by this user → reassign to system
        prisma.ticketAttachment.updateMany({
          where: { uploaderId: id },
          data: { uploaderId: systemUserId },
        }),
        // API tokens created by this user → reassign to system
        prisma.apiToken.updateMany({
          where: { createdById: id },
          data: { createdById: systemUserId },
        }),
        // Notification channels created by this user → reassign to system
        prisma.notificationChannel.updateMany({
          where: { createdById: id },
          data: { createdById: systemUserId },
        }),
      ])
    }

    // Phase 3: soft-delete user (set deletedAt)
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    // Phase 4: audit log
    await recordAudit(actor.id, 'DELETE', 'USER', id, `Xóa người dùng "${name}"`)

    return okResponse({ message: `Đã xóa người dùng "${name}".` })
  } catch (e) {
    return errorResponse(e)
  }
}