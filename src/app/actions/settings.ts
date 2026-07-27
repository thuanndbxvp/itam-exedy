'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth-guard'
import { updateSettings, getSettings } from '@/lib/settings'
import type { CommandResult } from '@/lib/errors'

export async function getSettingsAction(): Promise<CommandResult<Awaited<ReturnType<typeof getSettings>>>> {
  try {
    const settings = await getSettings()
    return { ok: true, data: settings }
  } catch (e) {
    console.error('[getSettingsAction]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi đọc cài đặt.' }
  }
}

export async function updateGeneralSettingsAction(data: {
  companyName: string
  currency: string
  timezone: string
  locale: string
}): Promise<CommandResult<void>> {
  try {
    await requireRole('ADMIN')
    await updateSettings({
      companyName: data.companyName,
      currency: data.currency,
      timezone: data.timezone,
      locale: data.locale,
    })
    revalidatePath('/')
    revalidatePath('/settings/general')
    return { ok: true, data: undefined }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[updateGeneralSettings]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu cài đặt.' }
  }
}

export async function updateBrandingSettingsAction(data: {
  logoUrl?: string
  primaryColor?: string
}): Promise<CommandResult<void>> {
  try {
    await requireRole('ADMIN')
    await updateSettings({
      logoUrl: data.logoUrl ?? null,
      primaryColor: data.primaryColor ?? '#2563eb',
    })
    revalidatePath('/')
    return { ok: true, data: undefined }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[updateBrandingSettings]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu cài đặt.' }
  }
}

export async function updateSecuritySettingsAction(data: {
  passwordMinLength?: number
  passwordRequireSpecial?: boolean
  sessionTimeoutMinutes?: number
  twoFactorEnabled?: boolean
}): Promise<CommandResult<void>> {
  try {
    await requireRole('ADMIN')
    await updateSettings({
      passwordMinLength: data.passwordMinLength ?? 8,
      passwordRequireSpecial: data.passwordRequireSpecial ?? false,
      sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? 480,
      twoFactorEnabled: data.twoFactorEnabled ?? false,
    })
    revalidatePath('/')
    return { ok: true, data: undefined }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[updateSecuritySettings]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu cài đặt.' }
  }
}
