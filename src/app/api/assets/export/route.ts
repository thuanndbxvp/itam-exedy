import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-guard'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusId = searchParams.get('statusId')
  const categoryId = searchParams.get('categoryId')
  const search = searchParams.get('search')

  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      ...(statusId && { statusId }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { assetTag: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    },
    include: {
      status: true,
      category: true,
      model: true,
      assignedUser: {
        select: { firstName: true, lastName: true },
      },
      assignedLocation: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const header = [
    'assetTag',
    'name',
    'serial',
    'model',
    'category',
    'status',
    'assignedTo',
    'location',
    'purchaseDate',
    'purchaseCost',
  ]

  const rows = assets.map((asset) => [
    asset.assetTag,
    `"${asset.name.replace(/"/g, '""')}"`,
    asset.serial || '',
    asset.model?.name || '',
    asset.category?.name || '',
    asset.status.name,
    asset.assignedUser
      ? `${asset.assignedUser.firstName}${asset.assignedUser.lastName ? ' ' + asset.assignedUser.lastName : ''}`
      : '',
    asset.assignedLocation?.name || '',
    asset.purchaseDate?.toISOString().split('T')[0] || '',
    asset.purchaseCost?.toString() || '',
  ])

  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="assets-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
