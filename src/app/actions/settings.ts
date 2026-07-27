'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getActorUserId, recordAudit } from '@/lib/audit'
import { runCommand } from '@/lib/commands/runCommand'
import { requirePermission } from '@/lib/permissions/guard'
import { updateSettings, getSettings } from '@/lib/settings'
import type { CommandResult } from '@/lib/errors'

export async function getSettingsAction(): Promise<CommandResult<Awaited<ReturnType<typeof getSettings>>>> {
  return runCommand(async () => {
    return await getSettings()
  }, 'getSettingsAction')
}

export async function updateGeneralSettingsAction(data: {
  companyName: string
  currency: string
  timezone: string
  locale: string
  supportEmail?: string
}): Promise<CommandResult<void>> {
  return runCommand(async () => {
    await requirePermission('settings.update')
    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)
    const oldSettings = await getSettings()
    await updateSettings({
      companyName: data.companyName,
      currency: data.currency,
      timezone: data.timezone,
      locale: data.locale,
      emailFrom: data.supportEmail?.trim() || null,
    })
    revalidatePath('/')
    revalidatePath('/settings/general')
    await recordAudit(
      actorId,
      'UPDATE',
      'USER',
      'system',
      'Cập nhật cài đặt chung',
      {
        oldValues: {
          companyName: oldSettings.companyName,
          currency: oldSettings.currency,
          timezone: oldSettings.timezone,
          locale: oldSettings.locale,
          supportEmail: oldSettings.emailFrom,
        },
        newValues: {
          companyName: data.companyName,
          currency: data.currency,
          timezone: data.timezone,
          locale: data.locale,
          supportEmail: data.supportEmail?.trim() || null,
        },
      },
    )
  }, 'updateGeneralSettings')
}

export async function updateBrandingSettingsAction(data: {
  logoUrl?: string
  primaryColor?: string
}): Promise<CommandResult<void>> {
  return runCommand(async () => {
    await requirePermission('settings.update')
    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)
    const oldSettings = await getSettings()
    await updateSettings({
      logoUrl: data.logoUrl ?? null,
      primaryColor: data.primaryColor ?? '#2563eb',
    })
    revalidatePath('/')
    await recordAudit(
      actorId,
      'UPDATE',
      'USER',
      'system',
      'Cập nhật thương hiệu',
      {
        oldValues: { logoUrl: oldSettings.logoUrl, primaryColor: oldSettings.primaryColor },
        newValues: { logoUrl: data.logoUrl ?? null, primaryColor: data.primaryColor ?? '#2563eb' },
      },
    )
  }, 'updateBrandingSettings')
}

export async function updateSecuritySettingsAction(data: {
  passwordMinLength?: number
  passwordRequireSpecial?: boolean
  sessionTimeoutMinutes?: number
  twoFactorEnabled?: boolean
}): Promise<CommandResult<void>> {
  return runCommand(async () => {
    await requirePermission('settings.update')
    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)
    const oldSettings = await getSettings()
    await updateSettings({
      passwordMinLength: data.passwordMinLength ?? 8,
      passwordRequireSpecial: data.passwordRequireSpecial ?? false,
      sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? 480,
      twoFactorEnabled: data.twoFactorEnabled ?? false,
    })
    revalidatePath('/')
    await recordAudit(
      actorId,
      'UPDATE',
      'USER',
      'system',
      'Cập nhật bảo mật',
      {
        oldValues: { passwordMinLength: oldSettings.passwordMinLength, passwordRequireSpecial: oldSettings.passwordRequireSpecial, sessionTimeoutMinutes: oldSettings.sessionTimeoutMinutes, twoFactorEnabled: oldSettings.twoFactorEnabled },
        newValues: { passwordMinLength: data.passwordMinLength ?? 8, passwordRequireSpecial: data.passwordRequireSpecial ?? false, sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? 480, twoFactorEnabled: data.twoFactorEnabled ?? false },
      },
    )
  }, 'updateSecuritySettings')
}