'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions/guard'
import { ValidationError } from '@/lib/errors'
import { updateSettings, getSettings } from '@/lib/settings'
import { encrypt } from '@/lib/crypto'
import { runCommand } from '@/lib/commands/runCommand'
import { sendEmail } from '@/lib/notifications/email'
import { render } from '@react-email/components'
import type { CommandResult } from '@/lib/errors'

export interface EmailSettingsInput {
  emailFrom: string
  emailFromName: string
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword?: string          // optional — nếu rỗng thì giữ nguyên password cũ
  smtpEncryption: 'tls' | 'ssl' | 'none'
  emailDomain?: string
}

export interface EmailSettingsResponse extends EmailSettingsInput {
  smtpPasswordSet: boolean        // KHÔNG trả plain password về client
}

export async function getEmailSettingsAction(): Promise<CommandResult<EmailSettingsResponse>> {
  return runCommand(async () => {
    await requirePermission('settings.update')
    const s = await getSettings()
    return {
      emailFrom: s.emailFrom ?? '',
      emailFromName: s.emailFromName ?? '',
      smtpHost: s.smtpHost ?? '',
      smtpPort: s.smtpPort ?? 587,
      smtpUsername: s.smtpUsername ?? '',
      smtpPassword: '',           // KHÔNG trả plain text
      smtpPasswordSet: !!s.smtpPassword,
      smtpEncryption: (s.smtpEncryption as 'tls' | 'ssl' | 'none' | null) ?? 'tls',
      emailDomain: s.emailDomain ?? '',
    }
  }, 'getEmailSettingsAction')
}

export async function updateEmailSettingsAction(
  data: EmailSettingsInput
): Promise<CommandResult<void>> {
  return runCommand(async () => {
    await requirePermission('settings.update')

    // Validate — throw ValidationError để runCommand convert thành CommandResult
    if (!data.emailFrom || !data.emailFrom.includes('@')) {
      throw new ValidationError('Email gửi không hợp lệ.', { field: 'emailFrom' })
    }
    if (!data.smtpHost) {
      throw new ValidationError('SMTP Host là bắt buộc.', { field: 'smtpHost' })
    }
    if (!data.smtpPort || data.smtpPort < 1 || data.smtpPort > 65535) {
      throw new ValidationError('SMTP Port không hợp lệ.', { field: 'smtpPort' })
    }

    // Encrypt password nếu có thay đổi
    let passwordToStore: string | null = null
    if (data.smtpPassword && data.smtpPassword.length > 0) {
      passwordToStore = encrypt(data.smtpPassword)
    } else {
      // Giữ nguyên password cũ
      const current = await getSettings()
      passwordToStore = current.smtpPassword // đã là encrypted
    }

    await updateSettings({
      emailFrom: data.emailFrom,
      emailFromName: data.emailFromName || 'IT Management',
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUsername: data.smtpUsername || null,
      smtpPassword: passwordToStore,
      smtpEncryption: data.smtpEncryption,
      emailDomain: data.emailDomain || null,
    })

    revalidatePath('/settings/email')
  }, 'updateEmailSettingsAction')
}

/**
 * Test gửi email — verify SMTP config hoạt động.
 * Admin gửi 1 email test đến email của mình.
 */
export async function testEmailAction(testEmail: string): Promise<CommandResult<void>> {
  return runCommand(async () => {
    await requirePermission('settings.update')

    if (!testEmail || !testEmail.includes('@')) {
      throw new ValidationError('Email không hợp lệ.', { field: 'testEmail' })
    }

    const TestEmailHtml = `<!doctype html>
<html>
<body style="font-family: system-ui, sans-serif; padding: 24px; color: #111;">
  <h1 style="font-size: 20px;">IT Management — Test Email</h1>
  <p>Email này xác nhận cấu hình SMTP hoạt động bình thường.</p>
  <p style="color: #666;">Gửi lúc: ${new Date().toLocaleString('vi-VN')}</p>
</body>
</html>`

    const html = await render(TestEmailHtml, { plainText: false })

    const result = await sendEmail({
      to: testEmail,
      subject: '[IT Management] Test Email — SMTP Configuration OK',
      html,
    })

    if (!result.ok) {
      // Throw ValidationError để runCommand convert (giữ nguyên pattern hiện có).
      throw new ValidationError(`Gửi email thất bại: ${result.error}`, { code: 'EMAIL_SEND_FAILED' })
    }
  }, 'testEmailAction')
}