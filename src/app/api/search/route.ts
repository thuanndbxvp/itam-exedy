import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface SearchResult {
  id: string
  assetTag?: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  serial?: string
  type: 'ASSET' | 'USER' | 'LICENSE'
  href: string
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const userId = session.user.id
  const role = session.user.role
  // F2 fix (security audit): EMPLOYEE chỉ search asset/license của mình + user lookup limited.
  // IT roles mới có full visibility.
  const isPrivileged = role === 'ADMIN' || role === 'IT_MANAGER' || role === 'IT_STAFF'

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const types = (searchParams.get('type') ?? 'ASSET,USER,LICENSE').split(',')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, data: { assets: [], users: [], licenses: [], total: 0 } })
  }

  const results: Record<string, SearchResult[]> = {
    ASSET: [],
    USER: [],
    LICENSE: [],
  }

  if (types.includes('ASSET')) {
    // EMPLOYEE: chỉ thấy asset đang được giao cho mình.
    const assetWhere = isPrivileged
      ? {
          deletedAt: null,
          OR: [
            { assetTag: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
            { serial: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {
          deletedAt: null,
          assignedUserId: userId,
          OR: [
            { assetTag: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
            { serial: { contains: q, mode: 'insensitive' as const } },
          ],
        }
    const assets = await prisma.asset.findMany({
      where: assetWhere,
      select: { id: true, assetTag: true, name: true, serial: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    results.ASSET = assets.map((a) => ({
      id: a.id,
      assetTag: a.assetTag,
      name: a.name,
      serial: a.serial ?? undefined,
      type: 'ASSET' as const,
      href: `/assets/${a.id}`,
    }))
  }

  if (types.includes('USER')) {
    // EMPLOYEE: tìm user (cho helpdesk tạo ticket) nhưng chỉ trả firstName/lastName (KHÔNG email).
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { employeeNum: { contains: q, mode: 'insensitive' } },
          ...(isPrivileged
            ? [{ email: { contains: q, mode: 'insensitive' as const } }]
            : []),
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    results.USER = users.map((u) => {
      // F2 leak: ẩn email cho non-privileged users.
      const item: SearchResult = {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName ?? undefined,
        type: 'USER' as const,
        href: `/settings/users/${u.id}`,
      }
      if (isPrivileged) item.email = u.email ?? undefined
      return item
    })
  }

  if (types.includes('LICENSE')) {
    // EMPLOYEE: chỉ thấy license seat của mình.
    const licenseWhere = isPrivileged
      ? {
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {
          deletedAt: null,
          seats: { some: { assignedUserId: userId, deletedAt: null } },
          name: { contains: q, mode: 'insensitive' as const },
        }
    const licenses = await prisma.license.findMany({
      where: licenseWhere,
      select: { id: true, name: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    results.LICENSE = licenses.map((l) => ({
      id: l.id,
      name: l.name,
      type: 'LICENSE' as const,
      href: `/licenses/${l.id}`,
    }))
  }

  const total = results.ASSET.length + results.USER.length + results.LICENSE.length

  return NextResponse.json({ ok: true, data: { ...results, total } })
}
