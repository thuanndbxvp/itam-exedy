/**
 * DELETE /api/assets/[id] — Soft-delete asset with password re-authentication.
 *
 * Security: requires current user password to confirm destructive action.
 * Soft-delete: sets deletedAt instead of hard-deleting.
 */
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('assets.delete')
    const { id } = await params

    // Parse body — password required
    let password: string | undefined
    try {
      const body = await req.json()
      password = body?.password
    } catch {
      // no body
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Yêu cầu nhập mật khẩu xác nhận.' },
        { status: 400 },
      )
    }

    // Verify current user password
    const currentUser = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { id: true, password: true, firstName: true, lastName: true },
    })

    if (!currentUser || !currentUser.password) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: 'Không thể xác thực tài khoản.' },
        { status: 401 },
      )
    }

    const isPasswordValid = await bcrypt.compare(password, currentUser.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: 'Mật khẩu không chính xác.' },
        { status: 403 },
      )
    }

    // Verify asset exists and is not already deleted
    const existing = await prisma.asset.findUnique({
      where: { id },
      select: { id: true, name: true, assetTag: true, deletedAt: true },
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy tài sản.' },
        { status: 404 },
      )
    }

    if (existing.deletedAt) {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', message: 'Tài sản đã bị xóa trước đó.' },
        { status: 409 },
      )
    }

    // Soft-delete asset
    await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    // Audit log
    const actorName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || actor.id
    await recordAudit(
      actor.id,
      'DELETE',
      'ASSET',
      id,
      `Xóa tài sản "${existing.name}" (${existing.assetTag}) — xác thực bằng mật khẩu bởi ${actorName}.`,
    )

    return okResponse({ message: `Đã xóa tài sản "${existing.name}".` })
  } catch (e) {
    return errorResponse(e)
  }
}
