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
    const assets = await prisma.asset.findMany({
      where: {
        deletedAt: null,
        OR: [
          { assetTag: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { serial: { contains: q, mode: 'insensitive' } },
        ],
      },
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
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { employeeNum: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    results.USER = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName ?? undefined,
      email: u.email ?? undefined,
      type: 'USER' as const,
      href: `/settings/users/${u.id}`,
    }))
  }

  if (types.includes('LICENSE')) {
    const licenses = await prisma.license.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { productKey: { contains: q, mode: 'insensitive' } },
        ],
      },
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
