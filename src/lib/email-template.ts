/**
 * Email Template renderer — Sprint C8.
 *
 * Database-stored templates với `{{variable}}` placeholders.
 * Dùng cho password reset, ticket assigned, asset checkout, etc.
 *
 * Fallback: nếu key không có trong DB → dùng default hardcoded HTML (back-compat).
 */
import prisma from '@/lib/prisma'

/** Các key hợp lệ. */
export const EMAIL_TEMPLATE_KEYS = [
  'TICKET_ASSIGNED',
  'TICKET_COMMENTED',
  'TICKET_STATUS_CHANGED',
  'TICKET_CLOSED',
  'PASSWORD_RESET',
  'ASSET_CHECKOUT',
] as const
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number]

/** Default templates — fallback nếu admin chưa edit. */
export const DEFAULT_TEMPLATES: Record<EmailTemplateKey, {
  subject: string
  htmlBody: string
  variables: string[]
}> = {
  TICKET_ASSIGNED: {
    subject: '[IT Helpdesk] {{ticketCode}} được giao cho bạn',
    htmlBody: `<p>Xin chào {{recipientName}},</p><p>Ticket <strong>{{ticketCode}}</strong> đã được giao cho bạn.</p><p><a href="{{link}}">Xem chi tiết</a></p>`,
    variables: ['recipientName', 'ticketCode', 'link'],
  },
  TICKET_COMMENTED: {
    subject: '[IT Helpdesk] {{ticketCode}} có comment mới',
    htmlBody: `<p>Xin chào {{recipientName}},</p><p>Ticket <strong>{{ticketCode}}</strong> có bình luận mới từ {{authorName}}:</p><blockquote>{{commentContent}}</blockquote><p><a href="{{link}}">Xem chi tiết</a></p>`,
    variables: ['recipientName', 'ticketCode', 'authorName', 'commentContent', 'link'],
  },
  TICKET_STATUS_CHANGED: {
    subject: '[IT Helpdesk] {{ticketCode}} → {{newStatus}}',
    htmlBody: `<p>Xin chào {{recipientName}},</p><p>Ticket <strong>{{ticketCode}}</strong> đã chuyển trạng thái sang <strong>{{newStatus}}</strong>.</p><p><a href="{{link}}">Xem chi tiết</a></p>`,
    variables: ['recipientName', 'ticketCode', 'newStatus', 'link'],
  },
  TICKET_CLOSED: {
    subject: '[IT Helpdesk] {{ticketCode}} đã đóng',
    htmlBody: `<p>Xin chào {{recipientName}},</p><p>Ticket <strong>{{ticketCode}}</strong> đã được đóng.</p><p><a href="{{link}}">Xem chi tiết</a></p>`,
    variables: ['recipientName', 'ticketCode', 'link'],
  },
  PASSWORD_RESET: {
    subject: '[IT Asset] Đặt lại mật khẩu',
    htmlBody: `<p>Xin chào {{userName}},</p><p>Bạn đã yêu cầu đặt lại mật khẩu. Bấm link sau để đặt lại (có hiệu lực trong 1 giờ):</p><p><a href="{{resetUrl}}">Đặt lại mật khẩu</a></p><p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>`,
    variables: ['userName', 'resetUrl'],
  },
  ASSET_CHECKOUT: {
    subject: '[IT Asset] Cấp phát asset {{assetTag}}',
    htmlBody: `<p>Xin chào {{userName}},</p><p>Bạn đã được cấp phát asset <strong>{{assetTag}}</strong> — {{assetName}}.</p>{{#if notes}}<p>Ghi chú: {{notes}}</p>{{/if}}<p><a href="{{link}}">Xem chi tiết asset</a></p>`,
    variables: ['userName', 'assetTag', 'assetName', 'notes', 'link'],
  },
}

/**
 * Render template thay `{{varName}}` → value từ vars.
 * Nếu var không tồn tại → leave placeholder.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const v = vars[key]
    if (v === null || v === undefined) return `{{${key}}}`
    return String(v)
  })
}

export interface RenderedTemplate {
  subject: string
  html: string
  variables: string[]
}

/**
 * Lấy template từ DB (hoặc default nếu không có) + render với vars.
 */
export async function renderEmailTemplate(
  key: EmailTemplateKey,
  vars: Record<string, string | number | null | undefined>
): Promise<RenderedTemplate> {
  let subject: string
  let htmlBody: string
  let variables: string[]

  try {
    const fromDb = await prisma.emailTemplate.findUnique({ where: { key } })
    if (fromDb) {
      subject = fromDb.subject
      htmlBody = fromDb.htmlBody
      variables = Array.isArray(fromDb.variables)
        ? (fromDb.variables as unknown[]).filter(
            (v): v is string => typeof v === 'string'
          )
        : []
    } else {
      const d = DEFAULT_TEMPLATES[key]
      subject = d.subject
      htmlBody = d.htmlBody
      variables = d.variables
    }
  } catch {
    const d = DEFAULT_TEMPLATES[key]
    subject = d.subject
    htmlBody = d.htmlBody
    variables = d.variables
  }

  return {
    subject: renderTemplate(subject, vars),
    html: renderTemplate(htmlBody, vars),
    variables,
  }
}
