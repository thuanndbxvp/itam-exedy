/**
 * /api/email-templates/[key] — Sprint C8.
 *
 * PUT : Update template (admin).
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import { EMAIL_TEMPLATE_KEYS } from '@/lib/email-template'

const Body = z.object({
  subject: z.string().min(1).max(500).trim(),
  htmlBody: z.string().min(1).max(50000),
})

export async function PUT(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'IT_MANAGER') {
      throw new ForbiddenError('Chỉ ADMIN/IT_MANAGER mới có quyền.')
    }
    const { key } = await ctx.params
    if (!EMAIL_TEMPLATE_KEYS.includes(key as never)) {
      throw new NotFoundError('EmailTemplate', key)
    }

    const json = await req.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) throw new ValidationError('Dữ liệu không hợp lệ.')

    const existing = await prisma.emailTemplate.findUnique({ where: { key } })

    const template = await prisma.emailTemplate.upsert({
      where: { key },
      create: {
        key,
        subject: parsed.data.subject,
        htmlBody: parsed.data.htmlBody,
        variables: [],
        updatedById: session.user.id,
      },
      update: {
        subject: parsed.data.subject,
        htmlBody: parsed.data.htmlBody,
        updatedById: session.user.id,
      },
    })

    return okResponse({ template: { ...template, isNew: !existing } })
  } catch (e) {
    return errorResponse(e)
  }
}
