/**
 * /api/saved-filters?scope=ASSET — Sprint C5.
 *
 * GET  : List saved filters của current user (own) + public filters của scope.
 * POST : Create new saved filter. Body: { name, scope, filters, isPublic? }.
 *
 * Permission: bất kỳ user đã đăng nhập cũng list được public + own.
 * Editing/Delete qua /api/saved-filters/[id].
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { ValidationError } from '@/lib/errors'

const SCOPES = ['ASSET', 'LICENSE', 'USER', 'TICKET'] as const
type Scope = (typeof SCOPES)[number]

const Body = z.object({
  name: z.string().min(1).max(100).trim(),
  scope: z.enum(SCOPES),
  filters: z.record(z.string(), z.unknown()),
  isPublic: z.boolean().optional().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    const scope = req.nextUrl.searchParams.get('scope')
    if (!scope || !SCOPES.includes(scope as Scope)) {
      throw new ValidationError(`Scope không hợp lệ: ${scope}`)
    }
    const userId = session.user.id

    const filters = await prisma.savedFilter.findMany({
      where: {
        scope,
        OR: [{ userId }, { isPublic: true }],
      },
      orderBy: [{ isPublic: 'desc' }, { name: 'asc' }],
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return okResponse({
      filters: filters.map((f) => ({
        id: f.id,
        name: f.name,
        scope: f.scope,
        filters: f.filters,
        isPublic: f.isPublic,
        isOwner: f.userId === userId,
        ownerName: `${f.user.firstName}${f.user.lastName ? ' ' + f.user.lastName : ''}`.trim(),
        createdAt: f.createdAt.toISOString(),
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
    const json = await req.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: 'VALIDATION',
          message: 'Dữ liệu không hợp lệ.',
          issues: parsed.error.issues,
        },
        { status: 400 }
      )
    }
    const { name, scope, filters, isPublic } = parsed.data

    const created = await prisma.savedFilter.create({
      data: {
        name,
        scope,
        filters: filters as object,
        isPublic,
        userId: session.user.id,
      },
    })

    return okResponse({ filter: created })
  } catch (e) {
    return errorResponse(e)
  }
}
