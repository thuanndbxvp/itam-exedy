/**
 * GET /api/helpdesk/search-assets — Sprint C.6
 *
 * Tìm kiếm tất cả tài sản trong công ty (không giới hạn user).
 * Chỉ IT staff mới được sử dụng endpoint này.
 *
 * C.6: Asset-centric Tickets cho phép IT Staff tạo ticket cho BẤT KỲ
 * thiết bị nào trong công ty mà không cần mượn danh nghĩa người khác.
 */
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import { requireUser, isItSide } from "@/lib/tickets/permissions";
import { ForbiddenError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    // C.6: Chỉ IT staff được phép search tất cả assets
    if (!isItSide(user.role)) {
      throw new ForbiddenError("Chỉ nhân viên IT mới được tìm kiếm tài sản.");
    }

    const q = req.nextUrl.searchParams.get("q") || "";
    const take = 20; // Giới hạn kết quả

    const [assets, licenseSeats] = await Promise.all([
      // Tìm kiếm assets
      prisma.asset.findMany({
        where: {
          deletedAt: null,
          OR: q
            ? [
                { name: { contains: q, mode: "insensitive" } },
                { assetTag: { contains: q, mode: "insensitive" } },
              ]
            : undefined,
        },
        orderBy: [{ assetTag: "asc" }],
        take,
        select: {
          id: true,
          assetTag: true,
          name: true,
          model: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      // Tìm kiếm license seats (optional, trả về empty array cho simplicity)
      Promise.resolve([]),
    ]);

    return okResponse({
      assets: assets.map((a) => ({
        id: a.id,
        assetTag: a.assetTag,
        name: a.name,
        modelName: a.model?.name ?? null,
        categoryName: a.category?.name ?? null,
      })),
      licenseSeats: [],
    });
  } catch (err) {
    return errorResponse(err);
  }
}
