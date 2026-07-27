/**
 * /api/api-tokens — Sprint C7.
 *
 * GET  : List tokens (ADMIN/IT_MANAGER).
 * POST : Create token (returns raw token ONCE).
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { ForbiddenError, ValidationError } from '@/lib/errors'
import { generateApiToken, validateScopes } from '@/lib/api-token'

const Body = z.object({
  name: z.string().min(1).max(100).trim(),
  scopes: z.array(z.string()).min(1),
  expiresAt: z.string().datetime().optional(),
})

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
      throw new ForbiddenError('Chỉ ADMIN/IT_MANAGER mới có quyền quản lý API tokens.')
    }

    const tokens = await prisma.apiToken.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    })

    return okResponse({
      tokens: tokens.map((t) => ({
        ...t,
        scopes: t.scopes,
        expiresAt: t.expiresAt?.toISOString() ?? null,
        lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
        revokedAt: t.revokedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        ownerName: `${t.createdBy.firstName}${t.createdBy.lastName ? ' ' + t.createdBy.lastName : ''}`.trim(),
      })),
    })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'IT_MANAGER') {
      throw new ForbiddenError('Chỉ ADMIN/IT_MANAGER mới có quyền tạo API tokens.')
    }

    const json = await req.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) throw new ValidationError('Dữ liệu không hợp lệ.')

    const scopes = validateScopes(parsed.data.scopes)
    if (scopes.length === 0) {
      throw new ValidationError('Scopes không hợp lệ.')
    }

    const { raw, prefix, hash } = generateApiToken()

    const token = await prisma.apiToken.create({
      data: {
        name: parsed.data.name,
        tokenPrefix: prefix,
        tokenHash: hash,
        scopes: scopes,
        ...(parsed.data.expiresAt && { expiresAt: new Date(parsed.data.expiresAt) }),
        createdById: session.user.id,
      },
    })

    return okResponse({
      token: {
        id: token.id,
        name: token.name,
        tokenPrefix: token.tokenPrefix,
        scopes: token.scopes,
        expiresAt: token.expiresAt?.toISOString() ?? null,
        createdAt: token.createdAt.toISOString(),
        // Raw token chỉ trả 1 lần duy nhất.
        rawToken: raw,
      },
    })
  } catch (e) {
    return errorResponse(e)
  }
}
