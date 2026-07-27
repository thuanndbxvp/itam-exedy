/**
 * /api/notifications — Epic F
 *
 * GET  : List notifications của user hiện tại (default: 50 gần nhất, mọi trạng thái).
 *        ?unread=1 : chỉ unread
 *
 * POST : Mark as read. Body: { id: string } hoặc { markAllRead: true }.
 *
 * Bell trên header sẽ polling GET ?unread=1&count=true mỗi 30s để hiện badge.
 */
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import { requireUser } from "@/lib/tickets/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const unreadOnly = sp.get("unread") === "1";
    const countOnly = sp.get("count") === "1";
    const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

    if (countOnly) {
      const count = await prisma.helpdeskNotification.count({
        where: { userId: user.id, isRead: false },
      });
      return okResponse({ count });
    }

    const notifications = await prisma.helpdeskNotification.findMany({
      where: { userId: user.id, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        link: true,
        isRead: true,
        createdAt: true,
        ticketId: true,
      },
    });

    return okResponse({ notifications });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { id?: string; markAllRead?: boolean };

    if (body.markAllRead) {
      await prisma.helpdeskNotification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return okResponse({ updated: "all" });
    }

    if (body.id) {
      const result = await prisma.helpdeskNotification.updateMany({
        where: { id: body.id, userId: user.id },
        data: { isRead: true, readAt: new Date() },
      });
      if (result.count === 0) {
        return okResponse({ updated: 0 });
      }
      return okResponse({ updated: result.count });
    }

    return okResponse({ updated: 0 });
  } catch (err) {
    return errorResponse(err);
  }
}