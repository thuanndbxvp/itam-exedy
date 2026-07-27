/**
 * GET /api/tickets/by-code/[code] — Epic F
 *
 * Resolve TKT-2026-0001 → ticket.id, rồi trả về chi tiết.
 * Dùng cho UI vì URL dùng code dễ đọc hơn cuid.
 */
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import { requireUser, canViewTicket, isItSide } from "@/lib/tickets/permissions";
import { NotFoundError } from "@/lib/errors";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const user = await requireUser();

    const ticket = await prisma.ticket.findUnique({
      where: { code },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
        team: { select: { id: true, name: true, slug: true } },
        reportedAsset: { select: { id: true, assetTag: true, name: true } },
        reportedLicenseSeat: {
          select: { id: true, license: { select: { id: true, name: true } } },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!ticket) throw new NotFoundError("Ticket", code);

    if (!canViewTicket(user, ticket)) {
      throw new NotFoundError("Ticket", code);
    }

    const filtered = {
      ...ticket,
      comments: ticket.comments.filter((c) => !c.isInternal || isItSide(user.role)),
    };
    return okResponse({ ticket: filtered });
  } catch (err) {
    return errorResponse(err);
  }
}