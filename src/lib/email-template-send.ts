/**
 * sendTemplateEmail — Sprint C8.
 * Convenience wrapper: render template from DB → gọi sendEmail.
 */
import { sendEmail } from '@/lib/notifications/email'
import {
  renderEmailTemplate,
  type EmailTemplateKey,
} from '@/lib/email-template'

export interface SendTemplateInput {
  key: EmailTemplateKey
  to: string | string[]
  vars: Record<string, string | number | null | undefined>
  from?: string
}

export async function sendTemplateEmail(input: SendTemplateInput) {
  const rendered = await renderEmailTemplate(input.key, input.vars)
  return sendEmail({
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    from: input.from,
  })
}
