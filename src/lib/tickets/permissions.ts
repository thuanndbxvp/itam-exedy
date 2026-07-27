/**
 * Helpdesk permission guards — Epic F.
 *
 * Tách riêng khỏi src/lib/auth-guard.ts vì:
 *   - auth-guard.ts dùng cho server actions / route handlers cơ bản (requireRole đơn lẻ)
 *   - permissions.ts là logic domain cụ thể của helpdesk (xem ticket nào, claim ticket nào)
 *
 * Quy tắc phân quyền (GLPI-inspired, rút gọn):
 *   - EMPLOYEE  : xem/đóng ticket của mình (reporter). Không thấy ticket của người khác.
 *   - IT_STAFF  : xem tất cả ticket (filter theo team mình là member). Claim, comment, đổi status.
 *   - IT_MANAGER: full quyền IT_STAFF + quản lý rule, xem stats, reassign.
 *   - ADMIN     : super admin (full + quản lý user).
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export type HelpdeskRole = "EMPLOYEE" | "IT_STAFF" | "IT_MANAGER" | "ADMIN";

export interface CurrentUser {
  id: string;
  role: HelpdeskRole;
  firstName: string;
  lastName: string | null;
  email: string | null;
}

/**
 * Lấy session hiện tại — throw nếu chưa đăng nhập.
 * Đảm bảo mọi route handler helpdesk đều có user xác định.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    throw new ForbiddenError("Bạn chưa đăng nhập.");
  }
  return {
    id: session.user.id,
    role: session.user.role as HelpdeskRole,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    email: session.user.email,
  };
}

/**
 * Check role có phải "IT side" không (được xem mọi ticket).
 */
export function isItSide(role: HelpdeskRole): boolean {
  return role === "IT_STAFF" || role === "IT_MANAGER" || role === "ADMIN";
}

/**
 * Employee có quyền báo lỗi cho asset này không?
 *
 * Quy tắc:
 *   - Nếu assetId null → không cần check (ticket "Vấn đề khác" — network, account...).
 *   - Nếu assetId != null → user phải đang là người được giao asset (Asset.assignedUserId === userId).
 *
 * Lưu ý: chưa có bảng AssignmentHistory với endDate, nên chỉ check trực tiếp assignedUserId.
 * Nếu sau này có lịch sử giao/đổi, sẽ nâng cấp thành check overlap interval.
 */
export async function canReportForAsset(
  userId: string,
  assetId: string | null | undefined
): Promise<boolean> {
  if (!assetId) return true; // "Vấn đề khác" → không cần asset
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { assignedUserId: true },
  });
  if (!asset) return false;
  return asset.assignedUserId === userId;
}

/**
 * Ai được xem ticket này?
 *
 *   - Reporter (EMPLOYEE) : LUÔN được xem ticket của mình.
 *   - IT_STAFF/IT_MANAGER/ADMIN: được xem tất cả (filter theo team optional).
 *   - Người khác: KHÔNG.
 *
 * Return boolean — caller tự throw 404/403.
 */
export function canViewTicket(
  user: CurrentUser,
  ticket: { reporterId: string; assigneeId: string | null; teamId: string | null }
): boolean {
  if (isItSide(user.role)) return true;
  return ticket.reporterId === user.id;
}

/**
 * Ai được claim (nhận xử lý) ticket này?
 *
 *   - Chỉ IT_STAFF/IT_MANAGER/ADMIN.
 *   - Ticket phải đang ở status NEW (chưa có assignee).
 *   - Nếu ticket có teamId → user phải là member của team đó (trừ ADMIN/IT_MANAGER).
 */
export async function canClaimTicket(
  user: CurrentUser,
  ticket: { status: string; assigneeId: string | null; teamId: string | null }
): Promise<boolean> {
  if (!isItSide(user.role)) return false;
  if (ticket.status !== "NEW") return false;
  if (ticket.assigneeId) return false; // đã có người nhận
  if (user.role === "ADMIN" || user.role === "IT_MANAGER") return true;
  if (!ticket.teamId) return true; // không gán team → bất kỳ IT_STAFF nào cũng claim được
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: ticket.teamId, userId: user.id } },
  });
  return !!member;
}

/**
 * Đóng ticket — reporter hoặc IT đều được.
 *
 *   - Reporter (EMPLOYEE): đóng ticket của mình (xác nhận đã xong).
 *   - IT_STAFF: đóng ticket được assign cho mình.
 *   - IT_MANAGER/ADMIN: đóng bất kỳ.
 */
export function canCloseTicket(
  user: CurrentUser,
  ticket: { reporterId: string; assigneeId: string | null }
): boolean {
  if (isItSide(user.role)) {
    if (user.role === "ADMIN" || user.role === "IT_MANAGER") return true;
    return ticket.assigneeId === user.id;
  }
  return ticket.reporterId === user.id;
}

/**
 * Đổi status / priority / assignee — chỉ IT side.
 */
export function canEditTicket(user: CurrentUser): boolean {
  return isItSide(user.role);
}

/**
 * Comment — ai cũng được (reporter + IT side).
 * Internal comment (isInternal=true) chỉ IT side mới thấy + được tạo.
 */
export function canComment(
  user: CurrentUser,
  ticket: { reporterId: string; assigneeId: string | null; teamId: string | null }
): { canComment: boolean; canCommentInternal: boolean } {
  const canView = canViewTicket(user, ticket);
  if (!canView) return { canComment: false, canCommentInternal: false };
  return {
    canComment: true,
    canCommentInternal: isItSide(user.role),
  };
}

/**
 * Quản lý rule (CRUD /api/admin/ticket-rules) — chỉ IT_MANAGER + ADMIN.
 */
export function canManageRules(user: CurrentUser): boolean {
  return user.role === "ADMIN" || user.role === "IT_MANAGER";
}
