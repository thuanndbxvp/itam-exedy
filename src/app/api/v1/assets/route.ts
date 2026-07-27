/**
 * /api/v1/assets — Sprint C7 (Public REST API).
 *
 * Auth: Bearer token (api token). Scope: `assets.read`.
 * Response: JSON `{ data: [...], total }`.
 *
 * MVP: read-only.
 */
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { hashToken, safeEqualHash, type ApiTokenScope } from '@/lib/api-token'

async function authenticateToken(
  req: NextRequest
): Promise<{ ok: true; scopes: ApiTokenScope[] } | { ok: false; status: number; message: string }> {
  const header = req.headers.get('authorization') ?? ''
  if (!header.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Authorization header missing.' }
  }
  const raw = header.slice(7).trim()
  if (!raw) return { ok: false, status: 401, message: 'Token trống.' }

  const hash = hashToken(raw)

  // Lookup + constant-time compare
  const tokens = await prisma.apiToken.findMany({
    where: { revokedAt: null },
    select: { id: true, tokenHash: true, scopes: true, expiresAt: true },
  })

  let matched:
    | { id: string; scopes: unknown; expiresAt: Date | null }
    | null = null
  for (const t of tokens) {
    if (safeEqualHash(t.tokenHash, hash)) {
      matched = t
      break
    }
  }
  if (!matched) {
    return { ok: false, status: 401, message: 'Token không hợp lệ hoặc đã thu hồi.' }
  }
  if (matched.expiresAt && matched.expiresAt < new Date()) {
    return { ok: false, status: 401, message: 'Token đã hết hạn.' }
  }

  const scopes = Array.isArray(matched.scopes)
    ? (matched.scopes as string[]).filter((s) =>
        ['assets.read', 'licenses.read', 'users.read', 'tickets.read'].includes(s)
      )
    : []

  // Update lastUsedAt (fire-and-forget)
  prisma.apiToken
    .update({ where: { id: matched.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined)

  return { ok: true, scopes: scopes as ApiTokenScope[] }
}

export async function GET(req: NextRequest) {
  const auth = await authenticateToken(req)
  if (!auth.ok) {
    return Response.json(
      { ok: false, code: 'UNAUTHORIZED', message: auth.message },
      { status: auth.status }
    )
  }
  if (!auth.scopes.includes('assets.read')) {
    return Response.json(
      { ok: false, code: 'FORBIDDEN', message: 'Token không có scope assets.read.' },
      { status: 403 }
    )
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200)
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0'), 0)
  const search = url.searchParams.get('search')?.trim() ?? ''

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { assetTag: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
        { serial: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { assetTag: 'asc' },
      select: {
        id: true,
        assetTag: true,
        name: true,
        serial: true,
        purchaseDate: true,
        assetEolDate: true,
        category: { select: { name: true } },
        model: { select: { name: true } },
        status: { select: { name: true } },
        assignedUser: {
          select: { firstName: true, lastName: true, email: true },
        },
        assignedLocation: { select: { name: true } },
      },
    }),
    prisma.asset.count({ where }),
  ])

  return Response.json({
    data: assets.map((a) => ({
      id: a.id,
      assetTag: a.assetTag,
      name: a.name,
      serial: a.serial,
      category: a.category?.name ?? null,
      model: a.model?.name ?? null,
      status: a.status?.name ?? null,
      assignedTo: a.assignedUser
        ? {
            firstName: a.assignedUser.firstName,
            lastName: a.assignedUser.lastName,
            email: a.assignedUser.email,
          }
        : null,
      assignedLocation: a.assignedLocation?.name ?? null,
      purchaseDate: a.purchaseDate?.toISOString() ?? null,
      eolDate: a.assetEolDate?.toISOString() ?? null,
    })),
    pagination: { limit, offset, total },
  })
}
