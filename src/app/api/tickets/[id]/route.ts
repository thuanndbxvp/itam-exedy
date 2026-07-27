/**
 * /api/tickets/[id] — Epic F
 *
 * GET   : Chi tiết ticket + comments timeline.
 * PATCH : Update status / priority / assignee / team. IT side only.
 * DELETE: Soft bằng status REJECTED (Epic F: không hard-delete, audit trail).
 *
 * Action phụ:
 *   - PATCH { action: "claim" }     : IT_STAFF tự nhận ticket (set assigneeId = self, status = ASSIGNED).
 *   - PATCH { action: "close" }     : Reporter hoặc IT đóng ticket.
 *   - PATCH { action: "reopen" }    : IT side reopen ticket (status = NEW, clear assigneeId, resolvedAt = null).
 *
 * Permission xem chi tiết:
 *   - EMPLOYEE: chỉ ticket của mình
 *   - IT side: mọi ticket
 *
 * Permission đổi status / claim:
 *   - IT side only (EMPLOYEE chỉ được close ticket của mình)
 */
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import {
  requireUser,
  canViewTicket,
  canEditTicket,
  canCloseTicket,
  canClaimTicket,
  isItSide,
} from "@/lib/tickets/permissions";
import { ForbiddenError, NotFoundError, ValidationError, InvalidStateError } from "@/lib/errors";
import { notify, notifyMany } from "@/lib/tickets/notifications";
import type { TicketPriority, TicketStatus } from "@prisma/client";

const VALID_STATUSES: TicketStatus[] = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];
const VALID_PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// ============================================================================
// GET
// ============================================================================

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
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
    if (!ticket) throw new NotFoundError("Ticket", id);

    if (!canViewTicket(user, ticket)) {
      // Trả 404 thay vì 403 để không lộ sự tồn tại
      throw new NotFoundError("Ticket", id);
    }

    // Lọc internal comment cho non-IT
    const filtered = {
      ...ticket,
      comments: ticket.comments.filter((c) => !c.isInternal || isItSide(user.role)),
    };
    return okResponse({ ticket: filtered });
  } catch (err) {
    return errorResponse(err);
  }
}

// ============================================================================
// PATCH
// ============================================================================

interface PatchBody {
  action?: "claim" | "close" | "reopen" | "update";
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  teamId?: string | null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await requireUser();
    const body = (await req.json()) as PatchBody;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        status: true,
        priority: true,
        reporterId: true,
        assigneeId: true,
        teamId: true,
      },
    });
    if (!ticket) throw new NotFoundError("Ticket", id);
    if (!canViewTicket(user, ticket)) throw new NotFoundError("Ticket", id);

    const action = body.action ?? "update";

    if (action === "claim") {
      const ok = await canClaimTicket(user, ticket);
      if (!ok) {
        throw new ForbiddenError(
          ticket.assigneeId
            ? "Ticket đã có người nhận xử lý."
            : ticket.status !== "NEW"
            ? `Không thể nhận ticket ở trạng thái ${ticket.status}.`
            : "Bạn không có quyền nhận ticket này."
        );
      }
      const updated = await prisma.ticket.update({
        where: { id },
        data: { assigneeId: user.id, status: "ASSIGNED" },
      });

      // Notify reporter
      await notify({
        userId: ticket.reporterId,
        ticketId: id,
        kind: "TICKET_ASSIGNED",
        title: `${ticket.code} đã được nhận xử lý`,
        body: `${user.firstName} ${user.lastName ?? ""} sẽ xử lý ticket của bạn.`,
        link: `/helpdesk/${ticket.code}`,
      });

      return okResponse({ ticket: updated });
    }

    if (action === "close") {
      if (!canCloseTicket(user, ticket)) {
        throw new ForbiddenError("Bạn không có quyền đóng ticket này.");
      }
      if (ticket.status === "CLOSED") throw new InvalidStateError("Ticket đã đóng.");
      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
          closedById: user.id,
        },
      });

      // Notify các bên liên quan
      const recipients = new Set<string>();
      if (ticket.assigneeId && ticket.assigneeId !== user.id) recipients.add(ticket.assigneeId);
      if (ticket.reporterId !== user.id) recipients.add(ticket.reporterId);
      await notifyMany(Array.from(recipients), {
        ticketId: id,
        kind: "TICKET_CLOSED",
        title: `${ticket.code} đã được đóng`,
        body: "Ticket đã được đóng — xem chi tiết để biết thêm.",
        link: `/helpdesk/${ticket.code}`,
      });

      return okResponse({ ticket: updated });
    }

    if (action === "reopen") {
      if (!canEditTicket(user)) throw new ForbiddenError("Chỉ IT mới có quyền mở lại ticket.");
      if (ticket.status !== "CLOSED" && ticket.status !== "REJECTED") {
        throw new InvalidStateError("Chỉ mở lại ticket đã đóng hoặc bị từ chối.");
      }
      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          status: "NEW",
          closedAt: null,
          closedById: null,
          resolvedAt: null,
        },
      });

      await notify({
        userId: ticket.reporterId,
        ticketId: id,
        kind: "TICKET_REOPENED",
        title: `${ticket.code} đã được mở lại`,
        body: "Ticket được mở lại để xử lý tiếp.",
        link: `/helpdesk/${ticket.code}`,
      });

      return okResponse({ ticket: updated });
    }

    if (action === "update") {
      // Đổi status/priority/assignee/team — chỉ IT side
      if (!canEditTicket(user)) {
        throw new ForbiddenError("Chỉ nhân viên IT mới có quyền chỉnh sửa ticket.");
      }
      const data: Record<string, unknown> = {};
      if (body.status) {
        if (!VALID_STATUSES.includes(body.status))
          throw new ValidationError(`Status không hợp lệ: ${body.status}`);
        data.status = body.status;
        if (body.status === "RESOLVED" && ticket.status !== "RESOLVED") {
          data.resolvedAt = new Date();
        }
        if (body.status !== "RESOLVED" && ticket.status === "RESOLVED") {
          data.resolvedAt = null;
        }
      }
      if (body.priority) {
        if (!VALID_PRIORITIES.includes(body.priority))
          throw new ValidationError(`Priority không hợp lệ: ${body.priority}`);
        data.priority = body.priority;
      }
      if (body.assigneeId !== undefined) {
        if (body.assigneeId) {
          const u = await prisma.user.findUnique({ where: { id: body.assigneeId }, select: { id: true } });
          if (!u) throw new NotFoundError("User", body.assigneeId);
        }
        data.assigneeId = body.assigneeId;
        if (body.assigneeId && ticket.status === "NEW") data.status = "ASSIGNED";
      }
      if (body.teamId !== undefined) {
        if (body.teamId) {
          const t = await prisma.team.findUnique({ where: { id: body.teamId }, select: { id: true } });
          if (!t) throw new NotFoundError("Team", body.teamId);
        }
        data.teamId = body.teamId;
      }

      if (Object.keys(data).length === 0) {
        throw new ValidationError("Không có trường nào để cập nhật.");
      }

      const updated = await prisma.ticket.update({ where: { id }, data });

      // Notify assignee mới (nếu thay đổi)
      if (
        body.assigneeId &&
        body.assigneeId !== ticket.assigneeId &&
        body.assigneeId !== user.id
      ) {
        await notify({
          userId: body.assigneeId,
          ticketId: id,
          kind: "TICKET_ASSIGNED",
          title: `Bạn được giao ${ticket.code}`,
          body: ticket.code,
          link: `/helpdesk/${ticket.code}`,
        });
      }

      // Notify reporter nếu status thay đổi
      if (body.status && body.status !== ticket.status && ticket.reporterId !== user.id) {
        await notify({
          userId: ticket.reporterId,
          ticketId: id,
          kind: "TICKET_STATUS_CHANGED",
          title: `${ticket.code} → ${body.status}`,
          body: null,
          link: `/helpdesk/${ticket.code}`,
        });
      }

      return okResponse({ ticket: updated });
    }

    throw new ValidationError(`Action không hợp lệ: ${action}`);
  } catch (err) {
    return errorResponse(err);
  }
}