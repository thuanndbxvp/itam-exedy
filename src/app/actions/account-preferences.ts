'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { EmailDigestFrequency, UiTheme } from '@prisma/client'
import { DomainError } from '@/lib/errors'
import type { CommandResult } from '@/lib/errors'
import { runCommand } from '@/lib/commands/runCommand'

/**
 * Đảm bảo UserPreference tồn tại. Nếu chưa → tạo mới với default.
 * Sprint D đã có migration tạo bảng, nhưng user cũ có thể chưa có row.
 * Idempotent — chạy nhiều lần OK.
 */
async function ensurePreference(userId: string) {
  const existing = await prisma.userPreference.findUnique({ where: { userId } })
  if (existing) return existing
  return prisma.userPreference.create({
    data: { userId },
  })
}

/**
 * B10 — Cập nhật notification preferences.
 */
export async function updateNotificationPrefsAction(data: {
  emailDigestFrequency?: EmailDigestFrequency
  muteUntil?: string | null // ISO string từ form (datetime-local) hoặc '' để clear
}): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      throw new DomainError('AUTH', 'Chưa đăng nhập.')
    }

    const freq: EmailDigestFrequency = data.emailDigestFrequency ?? 'DAILY'
    const muteUntil =
      data.muteUntil && data.muteUntil.trim() !== ''
        ? new Date(data.muteUntil)
        : null

    // Validate: muteUntil phải ở tương lai (nếu set)
    if (muteUntil && muteUntil.getTime() <= Date.now()) {
      throw new DomainError(
        'VALIDATION',
        'Thời điểm tắt thông báo phải ở tương lai.'
      )
    }

    await ensurePreference(userId)
    const pref = await prisma.userPreference.update({
      where: { userId },
      data: {
        emailDigestFrequency: freq,
        muteUntil,
      },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemType: 'USER',
        itemId: userId,
        userId,
        notes: `Cập nhật notification prefs (digest=${freq}, muteUntil=${muteUntil?.toISOString() ?? 'null'})`,
      },
    })

    revalidatePath('/account/notifications')
    revalidatePath('/account')
    return { id: pref.id }
  }, 'updateNotificationPrefsAction')
}

/**
 * B11 — Cập nhật appearance (theme + locale).
 *
 * Đồng thời set cookie `theme` để middleware/SSR áp dụng dark class ngay từ request đầu
 * (tránh FOUC — flash of unstyled content).
 */
export async function updateAppearancePrefsAction(data: {
  theme?: UiTheme
  locale?: string | null
}): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      throw new DomainError('AUTH', 'Chưa đăng nhập.')
    }

    const theme: UiTheme = data.theme ?? 'SYSTEM'
    const locale =
      data.locale && data.locale.trim() !== '' ? data.locale.trim() : null

    await ensurePreference(userId)
    const pref = await prisma.userPreference.update({
      where: { userId },
      data: { theme, locale },
    })

    // Cookie theme: set ngay để layout server-render có dark class.
    const cookieStore = await cookies()
    cookieStore.set('theme', theme, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemType: 'USER',
        itemId: userId,
        userId,
        notes: `Cập nhật appearance (theme=${theme}, locale=${locale ?? 'null'})`,
      },
    })

    revalidatePath('/account/appearance')
    revalidatePath('/account')
    return { id: pref.id }
  }, 'updateAppearancePrefsAction')
}

/**
 * B12 — Toggle 2FA optin (intent flag).
 *
 * Phase B chỉ lưu flag, KHÔNG thật sự issue OTP. Khi Epic M (2FA thật) triển khai
 * sẽ check `user.twoFactorOptin === true` để trigger TOTP flow.
 */
export async function toggleTwoFactorOptinAction(data: {
  optin: boolean
}): Promise<CommandResult<{ twoFactorOptin: boolean }>> {
  return runCommand(async () => {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      throw new DomainError('AUTH', 'Chưa đăng nhập.')
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorOptin: data.optin,
        // Khi optin lần đầu → flagged là enrolled (intent). Nếu tắt → reset enrolled.
        twoFactorEnrolled: data.optin ? true : false,
      },
      select: { twoFactorOptin: true, twoFactorEnrolled: true },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'TWO_FACTOR_OPTIN_TOGGLED',
        itemType: 'USER',
        itemId: userId,
        userId,
        notes: `2FA optin ${data.optin ? 'ON' : 'OFF'}`,
      },
    })

    revalidatePath('/account/security')
    return { twoFactorOptin: user.twoFactorOptin }
  }, 'toggleTwoFactorOptinAction')
}

/**
 * B13 — Server-side helper để ghi LOGIN action sau khi authorize() thành công.
 *
 * Được gọi từ authOptions trong lib/auth.ts (trong CredentialsProvider.authorize()).
 * KHÔNG throw — chỉ log warning nếu fail để không phá flow login.
 */
export async function recordLoginActionLog(params: {
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    await prisma.actionLog.create({
      data: {
        actionType: 'LOGIN',
        itemType: 'USER',
        itemId: params.userId,
        userId: params.userId,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        notes: 'Đăng nhập',
      },
    })
  } catch (e) {
    // Không throw — login vẫn phải thành công dù ghi log fail
    console.warn('[recordLoginActionLog] failed:', e)
  }
}