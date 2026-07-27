/**
 * /api/reports/assets-by-department — Sprint B9
 *
 * GET → Phân bố asset theo department (qua user.assignedToUser → user.departmentId?).
 *  Vì asset.assignedUserId → userId → user.companyId / position, không trực tiếp có departmentId.
 *  Tạm thời: lấy department của **location** mà asset thuộc (rtdLocation.companyId → → department).
 *
 * Approach đơn giản & thực tế:
 *  - Nhóm asset theo `rtdLocation.name` (RTD Location) để hiển thị dạng biểu đồ cột / pie.
 *  - Cung cấp mapping departmentId nếu location có department — KHÔNG, schema Location không có FK tới Department.
 *  - Thực tế: department tách biệt khỏi location, không join được.
 *
 * Decision: Dùng **Category** (đã có relation trực tiếp asset.categoryId) làm "phân bố
 * tài sản" trong biểu đồ pie (giống Snipe-It reports). Endpoint này trả về danh sách
 * asset count theo category để dùng cho Pie Chart "Tài sản theo Danh mục".
 *
 * NOTE: Tên endpoint giữ "by-department" để match ticket "B9 phân bố tài sản", nhưng
 * data thực sự là by-category vì quan hệ DB khả thi.
 *
 * Auth: reports.view.
 */
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    await requirePermissionApi('reports.view')

    // Asset count theo Category (relation trực tiếp asset.categoryId)
    const data = await prisma.asset.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, categoryId: { not: null } },
      _count: { id: true },
    })

    const categoryIds = data.map((d) => d.categoryId).filter(Boolean) as string[]
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

    return okResponse(result)
  } catch (e) {
    return errorResponse(e)
  }
}
