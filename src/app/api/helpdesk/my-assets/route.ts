/**
 * GET /api/helpdesk/my-assets
 *
 * Trả về danh sách tài sản user hiện tại đang được giao
 * (Asset.assignedUserId === userId) hoặc các thiết bị con đi kèm
 * (assignedAsset.assignedUserId === userId).
 *
 * Sprint C.8: Hiển thị thiết bị đính kèm (Child Assets)
 * - Thêm điều kiện lấy cả thiết bị con (chuột, phím...) đi kèm laptop
 * - Giúp Employee thấy đủ tài sản trong Dashboard và Helpdesk
 *
 * Auth: bất kỳ role nào cũng xem được (chỉ asset của chính mình).
 */
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import { requireUser } from "@/lib/tickets/permissions";

export async function GET() {
  try {
    const user = await requireUser();

    // Sprint C.8: Lấy cả asset trực tiếp và asset con (child assets)
    const [assets, licenseSeats] = await Promise.all([
      prisma.asset.findMany({
        where: {
          deletedAt: null,
          OR: [
            // Asset trực tiếp được gán cho user
            { assignedUserId: user.id },
            // C.8: Asset con (child) của asset được gán cho user
            // Ví dụ: User được gán Laptop → thì thấy cả chuột/phím đi kèm
            { assignedAsset: { assignedUserId: user.id } }
          ]
        },
        orderBy: [{ assetTag: "asc" }],
        select: {
          id: true,
          assetTag: true,
          name: true,
          model: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.licenseSeat.findMany({
        where: {
          deletedAt: null,
          OR: [
            { assignedUserId: user.id },
            { assignedAsset: { assignedUserId: user.id } }
          ]
        },
        orderBy: [{ license: { name: "asc" } }],
        select: {
          id: true,
          // F9 fix (security audit): KHÔNG trả productKey qua endpoint my-assets.
          // Ai có quyền xem full key thì dùng license detail UI (masked cho non-ADMIN).
          license: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return okResponse({
      assets: assets.map((a) => ({
        id: a.id,
        assetTag: a.assetTag,
        name: a.name,
        modelName: a.model?.name ?? null,
        categoryName: a.category?.name ?? null,
      })),
      licenseSeats: licenseSeats.map((s) => ({
        id: s.id,
        licenseId: s.license.id,
        licenseName: s.license.name,
        // productKey đã loại bỏ — user tự vào `/licenses/[id]` nếu muốn xem (masked).
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}