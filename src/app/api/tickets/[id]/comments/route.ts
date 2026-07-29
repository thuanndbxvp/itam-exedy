/**
 * /api/tickets/[id]/comments — Epic F
 *
 * GET  : List comments của ticket (lọc internal theo role).
 * POST : Thêm comment mới. Reporter hoặc IT side. Internal flag = true chỉ IT side.
 */
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import {
  requireUser,
  canViewTicket,
  canComment,
  isItSide,
} from "@/lib/tickets/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { notify } from "@/lib/tickets/notifications";
import pusher, { CHANNEL_HELPDESK, EVENT_TICKET_UPDATED } from "@/lib/pusher";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser();
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, reporterId: true, assigneeId: true, teamId: true, code: true },
    });
    if (!ticket) throw new NotFoundError("Ticket", id);
    if (!canViewTicket(user, ticket)) throw new NotFoundError("Ticket", id);

    const comments = await prisma.ticketComment.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Lọc internal nếu không phải IT
    const filtered = comments.filter((c) => !c.isInternal || isItSide(user.role));
    return okResponse({ comments: filtered });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser();
    const body = (await req.json()) as { content?: string; isInternal?: boolean };

    const content = body.content?.trim() ?? "";
    if (content.length < 1) throw new ValidationError("Nội dung comment trống.");

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        status: true,
        reporterId: true,
        assigneeId: true,
        teamId: true,
      },
    });
    if (!ticket) throw new NotFoundError("Ticket", id);

    const perms = canComment(user, ticket);
    if (!perms.canComment) throw new ForbiddenError("Bạn không có quyền comment ticket này.");

    const isInternal = !!body.isInternal;
    if (isInternal && !perms.canCommentInternal) {
      throw new ForbiddenError("Chỉ nhân viên IT mới được comment nội bộ.");
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorId: user.id,
        content,
        isInternal,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Touch ticket.updatedAt
    await prisma.ticket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Notify các bên liên quan (loại trừ author)
    const recipients = new Set<string>();
    if (ticket.reporterId !== user.id) recipients.add(ticket.reporterId);
    if (ticket.assigneeId && ticket.assigneeId !== user.id) recipients.add(ticket.assigneeId);
    // Internal comment → chỉ notify IT side (assignee, team lead…)
    // Public comment → notify cả reporter
    if (isInternal) {
      // chỉ assignee hoặc team leads
      if (ticket.teamId) {
        const leads = await prisma.teamMember.findMany({
          where: { teamId: ticket.teamId, isLead: true },
          select: { userId: true },
        });
        leads.forEach((l) => recipients.add(l.userId));
      }
      recipients.delete(ticket.reporterId);
    }
    await Promise.all(
      Array.from(recipients).map((userId) =>
        notify({
          userId,
          ticketId: id,
          kind: "TICKET_COMMENTED",
          title: `${ticket.code} có phản hồi mới`,
          body: `${user.firstName}: ${content.slice(0, 100)}`,
          link: `/helpdesk/${ticket.code}`,
        })
      )
    );

    // Pusher: Real-time notification (Sprint C.10)
    try {
      await pusher.trigger(CHANNEL_HELPDESK, EVENT_TICKET_UPDATED, {
        ticketId: id,
        code: ticket.code,
        message: `${ticket.code} có phản hồi mới`,
      });
    } catch (err) {
      console.error("[Pusher] Failed to trigger ticket-updated:", err);
    }

    return okResponse({ comment });
  } catch (err) {
    return errorResponse(err);
  }
}