'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { uploadFile } from '@/lib/upload'
import { runCommand } from '@/lib/commands/runCommand'
import { ValidationError, ForbiddenError } from '@/lib/errors'
import type { CommandResult } from '@/lib/errors'

/**
 * Auth guard yêu cầu user đã login.
 * Throw ForbiddenError nếu không có session → runCommand convert thành CommandResult.
 */
async function requireUser(): Promise<{ id: string; email: string | null }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new ForbiddenError('Chưa đăng nhập.')
  }
  return { id: session.user.id, email: session.user.email ?? null }
}

// ============================================================================
// UP-1: Update profile
// ============================================================================

export interface UpdateProfileInput {
  firstName: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  zip?: string
}

export async function updateProfileAction(
  data: UpdateProfileInput
): Promise<CommandResult<void>> {
  return runCommand(async () => {
    const user = await requireUser()

    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new ValidationError('Tên không được để trống.', { field: 'firstName' })
    }
    if (data.firstName.length > 100) {
      throw new ValidationError('Tên tối đa 100 ký tự.', { field: 'firstName' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        country: data.country?.trim() || null,
        zip: data.zip?.trim() || null,
      },
    })

    revalidatePath('/account/profile')
  }, 'updateProfileAction')
}

// ============================================================================
// UP-3: Change password
// ============================================================================

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export async function changePasswordAction(
  data: ChangePasswordInput
): Promise<CommandResult<void>> {
  return runCommand(async () => {
    const user = await requireUser()

    // Rate limit: 3 attempts / 15 min / user (per WORKFLOW Step 6)
    const limit = checkRateLimit({ key: `password-change:${user.id}`, max: 3, windowMs: 15 * 60_000 })
    if (!limit.allowed) {
      const minutes = Math.ceil((limit.resetAt - Date.now()) / 60_000)
      throw new ForbiddenError(
        `Quá nhiều lần thử. Vui lòng đợi ${minutes} phút.`,
        { resetAt: limit.resetAt }
      )
    }

    // Validate input
    if (data.newPassword !== data.confirmPassword) {
      throw new ValidationError('Mật khẩu mới không khớp.', { field: 'confirmPassword' })
    }
    if (data.newPassword.length < 8) {
      throw new ValidationError('Mật khẩu phải ≥8 ký tự.', { field: 'newPassword' })
    }
    if (data.newPassword === data.currentPassword) {
      throw new ValidationError('Mật khẩu mới phải khác mật khẩu hiện tại.', {
        field: 'newPassword',
      })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      throw new ForbiddenError('Tài khoản không tồn tại.')
    }
    if (!dbUser.password) {
      throw new ForbiddenError(
        'Tài khoản dùng SSO, không thể đổi mật khẩu local. Liên hệ admin.'
      )
    }

    const match = await bcrypt.compare(data.currentPassword, dbUser.password)
    // Bảo vệ khỏi timing attack: nếu fail, vẫn chạy 1 bcrypt hash để equalize thời gian.
    if (!match) {
      await bcrypt.hash(data.newPassword, 12) // waste ~250ms
      throw new ForbiddenError('Mật khẩu hiện tại không đúng.')
    }

    const hashed = await bcrypt.hash(data.newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
      },
    })

    revalidatePath('/account/security')
  }, 'changePasswordAction')
}

// ============================================================================
// UP-2: Upload avatar (uses src/lib/upload.ts stub)
// ============================================================================

export async function uploadAvatarAction(
  formData: FormData
): Promise<CommandResult<{ url: string }>> {
  return runCommand(async () => {
    const user = await requireUser()

    const file = formData.get('file')
    if (!(file instanceof File)) {
      throw new ValidationError('Chưa chọn file.', { field: 'file' })
    }

    // Client-side cũng validate, server-side double-check
    if (file.size > 1024 * 1024) {
      throw new ValidationError('Avatar tối đa 1MB.', { field: 'file' })
    }
    const ALLOWED = ['image/png', 'image/jpeg', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      throw new ValidationError(
        `Loại file ${file.type} không được phép. Chỉ PNG/JPG/WEBP.`,
        { field: 'file' }
      )
    }

    const upload = await uploadFile({
      file,
      type: 'avatar',
      entityId: user.id,
    })

    if (!upload.ok || !upload.url) {
      throw new ValidationError(upload.error ?? 'Upload thất bại.')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: upload.url },
    })

    revalidatePath('/account/profile')
    return { url: upload.url }
  }, 'uploadAvatarAction')
}