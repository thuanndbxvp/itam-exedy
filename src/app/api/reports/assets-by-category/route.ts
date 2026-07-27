import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    // F3 fix (security audit): gate reports.view — EMPLOYEE không được xem breakdown toàn công ty.
    await requirePermissionApi('reports.view')

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

    return okResponse(result)
  } catch (e) {
    return errorResponse(e)
  }
}
