import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const data = await prisma.asset.groupBy({
    by: ['categoryId'],
    where: { deletedAt: null, categoryId: { not: null } },
    _count: { id: true },
  })

  const categoryIds = data
    .map((d) => d.categoryId)
    .filter(Boolean) as string[]

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  })

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const result = data
    .map((d) => {
      const category = d.categoryId ? categoryMap.get(d.categoryId) : null
      return {
        categoryId: d.categoryId,
        categoryName: category?.name ?? 'Unknown',
        color: category?.color ?? '#6b7280',
        count: d._count.id,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({ ok: true, data: result })
}
