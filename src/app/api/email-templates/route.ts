/**
 * /api/email-templates — Sprint C8.
 *
 * GET : List all templates (admin).
 * POST : Upsert 1 template by key (admin, for "Import defaults").
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { ForbiddenError } from '@/lib/errors'
import { EMAIL_TEMPLATE_KEYS, DEFAULT_TEMPLATES } from '@/lib/email-template'

export async function GET() {
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

    // Return all known keys (use DB version if exists, else default)
    const fromDb = await prisma.emailTemplate.findMany()
    const byKey = new Map(fromDb.map((t) => [t.key, t]))

    const templates = EMAIL_TEMPLATE_KEYS.map((key) => {
      const db = byKey.get(key)
      if (db) {
        return {
          key,
          subject: db.subject,
          htmlBody: db.htmlBody,
          variables: Array.isArray(db.variables)
            ? (db.variables as unknown[]).filter(
                (v): v is string => typeof v === 'string'
              )
            : [],
          updatedAt: db.updatedAt.toISOString(),
        }
      }
      return DEFAULT_TEMPLATES[key]
    })

    return okResponse({ templates })
  } catch (e) {
    return errorResponse(e)
  }
}
