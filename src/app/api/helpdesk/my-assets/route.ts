/**
 * GET /api/helpdesk/my-assets
 *
 * Trả về danh sách tài sản user hiện tại đang được giao
 * (Asset.assignedUserId === userId). Dùng cho dropdown "Tài sản của tôi"
 * trên form tạo ticket.
 *
 * Cũng trả về LicenseSeat mà user đang sở hữu — để user báo lỗi license
 * (vd: "không vào được Photoshop với license công ty cấp").
 *
 * Auth: bất kỳ role nào cũng xem được (chỉ asset của chính mình).
 */
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import { requireUser } from "@/lib/tickets/permissions";

export async function GET() {
  try {
    const user = await requireUser();

    const [assets, licenseSeats] = await Promise.all([
      prisma.asset.findMany({
        where: {
          assignedUserId: user.id,
          deletedAt: null,
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
          assignedUserId: user.id,
          deletedAt: null,
        },
        orderBy: [{ license: { name: "asc" } }],
        select: {
          id: true,
          license: {
            select: { id: true, name: true, productKey: true },
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
        productKey: s.license.productKey,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}