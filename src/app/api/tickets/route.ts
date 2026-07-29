/**
 * /api/tickets — Epic F
 *
 * GET  : List tickets (filter theo role).
 *        - EMPLOYEE: chỉ ticket của mình
 *        - IT_STAFF: tất cả (default filter open)
 *        - IT_MANAGER/ADMIN: tất cả
 *        Query: status, category, priority, mine=1 (chỉ ticket assignee=mình), teamId
 *
 * POST : Tạo ticket mới. Bất kỳ role nào cũng tạo được (incl. EMPLOYEE).
 *        Validation:
 *          - title + description required
 *          - type/category/priority hợp lệ
 *          - Nếu reportedAssetId != null → user phải là người được giao asset
 *          - Nếu reportedLicenseSeatId != null → user phải sở hữu seat
 *        Auto-assign: chạy rule engine để set teamId.
 *        SLA: set slaDueAt theo priority.
 *        Code: auto-gen TKT-YYYY-NNNN.
 *        Notify: tạo notification cho assignee (nếu có) hoặc team members.
 */
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import { canReportForAsset, isItSide, type CurrentUser } from "@/lib/tickets/permissions";
import { ValidationError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { generateTicketCode } from "@/lib/tickets/code";
import { computeSlaDueAt } from "@/lib/tickets/sla";
import { resolveAssignmentRule } from "@/lib/tickets/auto-assign";
import { notify, notifyMany } from "@/lib/tickets/notifications";
import type { TicketCategory, TicketPriority, TicketStatus, TicketType } from "@prisma/client";
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import pusher, { CHANNEL_HELPDESK, EVENT_TICKET_CREATED } from "@/lib/pusher";

const VALID_TYPES: TicketType[] = ["INCIDENT", "REQUEST"];
const VALID_CATEGORIES: TicketCategory[] = ["HARDWARE", "SOFTWARE", "NETWORK", "ACCOUNT", "OTHER"];
const VALID_PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const VALID_STATUSES: TicketStatus[] = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

// ============================================================================
// GET — list
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await requirePermissionApi('helpdesk.view');
    const sp = req.nextUrl.searchParams;

    const status = sp.get("status") as TicketStatus | null;
    const category = sp.get("category") as TicketCategory | null;
    const priority = sp.get("priority") as TicketPriority | null;
    const mine = sp.get("mine") === "1";
    const teamId = sp.get("teamId");
    const assigneeId = sp.get("assigneeId");
    const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

    const where: Record<string, unknown> = {};
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (priority && VALID_PRIORITIES.includes(priority)) where.priority = priority;

    if (!isItSide(user.role)) {
      // Employee: chỉ ticket của mình
      where.reporterId = user.id;
    } else if (mine) {
      // IT staff chọn "của tôi"
      where.assigneeId = user.id;
    } else if (assigneeId) {
      // Filter theo assignee cu the (A6)
      where.assigneeId = assigneeId;
    } else if (teamId) {
      where.teamId = teamId;
    }
    // else: IT_STAFF/IT_MANAGER/ADMIN → tất cả

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        code: true,
        title: true,
        type: true,
        status: true,
        priority: true,
        category: true,
        slaDueAt: true,
        createdAt: true,
        updatedAt: true,
        reporter: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        team: { select: { id: true, name: true, slug: true } },
        reportedAsset: { select: { id: true, assetTag: true, name: true } },
        reportedLicenseSeat: {
          select: {
            id: true,
            license: { select: { id: true, name: true } },
          },
        },
        _count: { select: { comments: true } },
      },
    });

    return okResponse({ tickets });
  } catch (err) {
    return errorResponse(err);
  }
}

// ============================================================================
// POST — create
// ============================================================================

interface CreateTicketInput {
  title: string;
  description: string;
  type?: TicketType;
  priority?: TicketPriority;
  category?: TicketCategory;
  reportedAssetId?: string | null;
  reportedLicenseSeatId?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('helpdesk.create_ticket');
    const body = (await req.json()) as CreateTicketInput;

    // ----- Validate -----
    const title = body.title?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    if (title.length < 5) throw new ValidationError("Tiêu đề tối thiểu 5 ký tự");
    if (description.length < 10) throw new ValidationError("Mô tả tối thiểu 10 ký tự");

    const type: TicketType = body.type ?? "INCIDENT";
    if (!VALID_TYPES.includes(type)) throw new ValidationError(`Type không hợp lệ: ${body.type}`);

    const category: TicketCategory = body.category ?? "OTHER";
    if (!VALID_CATEGORIES.includes(category))
      throw new ValidationError(`Category không hợp lệ: ${body.category}`);

    const priority: TicketPriority = body.priority ?? "MEDIUM";
    if (!VALID_PRIORITIES.includes(priority))
      throw new ValidationError(`Priority không hợp lệ: ${body.priority}`);

    const reportedAssetId = body.reportedAssetId || null;
    const reportedLicenseSeatId = body.reportedLicenseSeatId || null;

    // ----- C.6: Permission check — IT staff có quyền báo lỗi cho BẤT KỲ asset nào -----
    const isIT = ['ADMIN', 'IT_MANAGER', 'IT_STAFF'].includes(user.role);

    if (reportedAssetId && !isIT) {
      const ok = await canReportForAsset(user.id, reportedAssetId);
      if (!ok) throw new ForbiddenError("Bạn không có quyền báo lỗi cho tài sản này.");
    }
    if (reportedLicenseSeatId && !isIT) {
      const seat = await prisma.licenseSeat.findUnique({
        where: { id: reportedLicenseSeatId },
        select: { assignedUserId: true, license: { select: { name: true } } },
      });
      if (!seat) throw new NotFoundError("LicenseSeat", reportedLicenseSeatId);
      if (seat.assignedUserId !== user.id)
        throw new ForbiddenError(`Bạn không sở hữu license "${seat.license.name}"`);
    }

    // ----- Auto-assign rule -----
    const { teamId: ruleTeamId, assigneeId: ruleAssigneeId } = await resolveAssignmentRule({
      category,
      priority,
      type,
    });

    // ----- Tạo ticket -----
    const code = await generateTicketCode();
    const slaDueAt = computeSlaDueAt(priority);

    const ticket = await prisma.ticket.create({
      data: {
        code,
        title,
        description,
        type,
        category,
        priority,
        status: ruleAssigneeId ? "ASSIGNED" : "NEW",
        reporterId: user.id,
        assigneeId: ruleAssigneeId,
        teamId: ruleTeamId,
        reportedAssetId,
        reportedLicenseSeatId,
        slaDueAt,
      },
      select: { id: true, code: true, title: true, status: true, assigneeId: true, teamId: true },
    });

    // ----- Comment đầu tiên (mô tả chính là comment) -----
    await prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        authorId: user.id,
        content: description,
        isInternal: false,
      },
    });

    // ----- Notification -----
    await notifyCreatedTicket(user, ticket);

    // ----- Pusher: Real-time notification (Sprint C.10) -----
    try {
      await pusher.trigger(CHANNEL_HELPDESK, EVENT_TICKET_CREATED, {
        ticketId: ticket.id,
        code: ticket.code,
        title: ticket.title,
      });
    } catch (err) {
      // Log but don't fail the request
      console.error("[Pusher] Failed to trigger ticket-created:", err);
    }

    // ----- Trả về ticket đầy đủ -----
    const full = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        team: { select: { id: true, name: true, slug: true } },
        reportedAsset: { select: { id: true, assetTag: true, name: true } },
        reportedLicenseSeat: {
          select: { id: true, license: { select: { id: true, name: true } } },
        },
      },
    });
    return okResponse({ ticket: full });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Push notification cho các bên liên quan khi ticket mới tạo.
 */
async function notifyCreatedTicket(
  reporter: CurrentUser,
  ticket: { id: string; code: string; title: string; assigneeId: string | null; teamId: string | null }
): Promise<void> {
  const title = `Ticket mới: ${ticket.code}`;
  const body = ticket.title;
  const link = `/helpdesk/${ticket.code}`;

  if (ticket.assigneeId) {
    // Có assignee cụ thể → notify 1 người
    await notify({
      userId: ticket.assigneeId,
      ticketId: ticket.id,
      kind: "TICKET_ASSIGNED",
      title,
      body,
      link,
    });
  } else if (ticket.teamId) {
    // Gán team → notify tất cả member của team
    const members = await prisma.teamMember.findMany({
      where: { teamId: ticket.teamId },
      select: { userId: true },
    });
    await notifyMany(
      members.map((m) => m.userId),
      { ticketId: ticket.id, kind: "TICKET_CREATED", title, body, link }
    );
  }
  // else: không assignee, không team → chỉ hiện trong inbox IT_STFF
}