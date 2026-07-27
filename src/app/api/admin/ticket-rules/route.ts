/**
 * /api/admin/ticket-rules — Epic F
 *
 * GET    : List all rules (IT_MANAGER / ADMIN only).
 * POST   : Tạo rule mới.
 * PATCH  : Update rule (theo body.id).
 * DELETE : Xoá rule (theo body.id).
 */
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, okResponse } from "@/lib/api";
import { requireUser, canManageRules } from "@/lib/tickets/permissions";
import { ValidationError, NotFoundError, ForbiddenError } from "@/lib/errors";
import type { TicketCategory, TicketPriority, TicketType } from "@prisma/client";

const VALID_CATEGORIES: TicketCategory[] = ["HARDWARE", "SOFTWARE", "NETWORK", "ACCOUNT", "OTHER"];
const VALID_PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const VALID_TYPES: TicketType[] = ["INCIDENT", "REQUEST"];

async function loadRules() {
  const rules = await prisma.helpdeskAssignmentRule.findMany({
    orderBy: [{ category: "asc" }, { weight: "desc" }],
    include: {
      team: { select: { id: true, name: true, slug: true } },
    },
  });
  return rules;
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!canManageRules(user)) throw new ForbiddenError("Chỉ IT Manager / Admin mới có quyền.");
    const rules = await loadRules();
    const teams = await prisma.team.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    const users = await prisma.user.findMany({
      where: { role: { in: ["IT_STAFF", "IT_MANAGER"] }, activated: true, deletedAt: null },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    return okResponse({ rules, teams, users });
  } catch (err) {
    return errorResponse(err);
  }
}

interface CreateRuleInput {
  name: string;
  category: TicketCategory;
  priority?: TicketPriority | null;
  type?: TicketType | null;
  teamId?: string | null;
  assignToUserId?: string | null;
  weight?: number;
  isActive?: boolean;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageRules(user)) throw new ForbiddenError("Chỉ IT Manager / Admin mới có quyền.");
    const body = (await req.json()) as CreateRuleInput;

    if (!body.name?.trim()) throw new ValidationError("Tên rule bắt buộc.");
    if (!VALID_CATEGORIES.includes(body.category))
      throw new ValidationError(`Category không hợp lệ: ${body.category}`);
    if (body.priority && !VALID_PRIORITIES.includes(body.priority))
      throw new ValidationError(`Priority không hợp lệ: ${body.priority}`);
    if (body.type && !VALID_TYPES.includes(body.type))
      throw new ValidationError(`Type không hợp lệ: ${body.type}`);

    const rule = await prisma.helpdeskAssignmentRule.create({
      data: {
        name: body.name.trim(),
        category: body.category,
        priority: body.priority ?? null,
        type: body.type ?? null,
        teamId: body.teamId || null,
        assignToUserId: body.assignToUserId || null,
        weight: body.weight ?? 100,
        isActive: body.isActive ?? true,
        notes: body.notes ?? null,
      },
    });
    return okResponse({ rule });
  } catch (err) {
    return errorResponse(err);
  }
}

interface UpdateRuleInput extends Partial<CreateRuleInput> {
  id: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageRules(user)) throw new ForbiddenError("Chỉ IT Manager / Admin mới có quyền.");
    const body = (await req.json()) as UpdateRuleInput;
    if (!body.id) throw new ValidationError("Thiếu rule id.");

    const existing = await prisma.helpdeskAssignmentRule.findUnique({ where: { id: body.id } });
    if (!existing) throw new NotFoundError("Rule", body.id);

    const rule = await prisma.helpdeskAssignmentRule.update({
      where: { id: body.id },
      data: {
        name: body.name ?? existing.name,
        category: body.category ?? existing.category,
        priority: body.priority === undefined ? existing.priority : body.priority,
        type: body.type === undefined ? existing.type : body.type,
        teamId: body.teamId === undefined ? existing.teamId : body.teamId || null,
        assignToUserId:
          body.assignToUserId === undefined
            ? existing.assignToUserId
            : body.assignToUserId || null,
        weight: body.weight ?? existing.weight,
        isActive: body.isActive ?? existing.isActive,
        notes: body.notes === undefined ? existing.notes : body.notes,
      },
    });
    return okResponse({ rule });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!canManageRules(user)) throw new ForbiddenError("Chỉ IT Manager / Admin mới có quyền.");
    const body = (await req.json()) as { id?: string };
    if (!body.id) throw new ValidationError("Thiếu rule id.");

    const existing = await prisma.helpdeskAssignmentRule.findUnique({ where: { id: body.id } });
    if (!existing) throw new NotFoundError("Rule", body.id);

    await prisma.helpdeskAssignmentRule.delete({ where: { id: body.id } });
    return okResponse({ deleted: body.id });
  } catch (err) {
    return errorResponse(err);
  }
}