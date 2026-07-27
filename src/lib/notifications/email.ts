/**
 * Notification email service — SMTP config từ Settings (UI-defined).
 *
 * Thay thế Resend/Vercel env vars bằng UI-defined SMTP credentials trong
 * `/settings/email`. Password mã hóa AES-256-GCM, decrypt on-demand.
 *
 * Transporter cached theo host+port+user+encryption → tránh reconnect.
 */
import nodemailer, { Transporter } from 'nodemailer'
import { getSettings } from '@/lib/settings'
import { decrypt } from '@/lib/crypto'

export interface EmailPayload {
  to: string | string[]
  subject: string
  /** HTML body đã render sẵn (React Email render → string). */
  html: string
  /** Optional override From header. */
  from?: string
}

export interface EmailResult {
  ok: boolean
  messageId?: string
  error?: string
}

/**
 * Cache transporter — tránh reconnect mỗi lần gửi.
 * Key cache = smtp host + port + user (nếu config đổi → reconnect).
 */
let transporterCache: {
  key: string
  transporter: Transporter
} | null = null

async function getTransporter(): Promise<Transporter | null> {
  const s = await getSettings()

  if (!s.smtpHost || !s.smtpPort) {
    console.warn('[email] SMTP chưa được cấu hình trong Settings')
    return null
  }

  const cacheKey = `${s.smtpHost}:${s.smtpPort}:${s.smtpUsername ?? ''}:${s.smtpEncryption ?? 'tls'}`

  // Reuse nếu config không đổi
  if (transporterCache?.key === cacheKey) {
    return transporterCache.transporter
  }

  const password = decrypt(s.smtpPassword)
  const encryption = s.smtpEncryption ?? 'tls'

  const transporter = nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: encryption === 'ssl', // SSL = port 465
    requireTLS: encryption === 'tls',
    auth: s.smtpUsername
      ? {
          user: s.smtpUsername,
          pass: password ?? '',
        }
      : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      // Không verify self-signed cert cho internal SMTP
      rejectUnauthorized: encryption !== 'none',
    },
  })

  transporterCache = { key: cacheKey, transporter }
  return transporter
}

/**
 * Gửi email qua SMTP (đọc từ Settings).
 * Trả về { ok: true } nếu gửi thành công.
 *
 * @param payload - Email payload
 * @returns { ok: true, messageId } hoặc { ok: false, error }
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const transporter = await getTransporter()
  if (!transporter) {
    return {
      ok: false,
      error: 'SMTP chưa được cấu hình. Vào /settings/email để thiết lập.',
    }
  }

  const s = await getSettings()
  const fromAddress = payload.from ?? s.emailFrom ?? 'noreply@localhost'
  const fromName = s.emailFromName ?? 'IT Management'
  const fromHeader = `"${fromName}" <${fromAddress}>`

  try {
    const info = await transporter.sendMail({
      from: fromHeader,
      to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
      subject: payload.subject,
      html: payload.html,
    })

    console.log(`[email] Sent: ${info.messageId} → ${payload.to}`)
    return { ok: true, messageId: info.messageId }
  } catch (e) {
    const err = e as Error
    console.error(`[email] Send failed: ${err.message}`)
    return { ok: false, error: err.message }
  }
}