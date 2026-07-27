import prisma from "@/lib/prisma";
import type { ActionType, ItemType } from "@prisma/client";

// Module-level cache — tránh query User 'system' lặp lại mỗi request.
// Tier 2 dùng được trong Node.js Process (server actions chạy trong server runtime).
let systemUserIdCache: string | null = null;

/**
 * Lấy ID của User 'system' (FK anchor cho ActionLog khi không có actor thật).
 * - Nếu có session → trả session.user.id (User thật login)
 * - Nếu không có session → fallback User 'system' (đã seed ở A1 BƯỚC 5)
 * - Nếu cả 2 đều không có → throw lỗi rõ ràng
 *
 * @param sessionUserId - Lấy từ getServerSession(authOptions)?.user?.id
 * @returns User ID (cuid)
 * @throws Error nếu DB chưa seed User 'system' (chắc chắn A2 không nên xảy ra nếu A1 đã PASS)
 */
export async function getActorUserId(sessionUserId?: string | null): Promise<string> {
  // 1. Ưu tiên session thật (khi đã login)
  if (sessionUserId) {
    return sessionUserId;
  }

  // 2. Fallback User 'system' (cache để tránh query lặp trong cùng 1 process)
  if (systemUserIdCache) {
    return systemUserIdCache;
  }

  // 3. Query User có username='system' (đã seed ở A1 BƯỚC 5)
  const systemUser = await prisma.user.findUnique({
    where: { username: 'system' }
  });

  if (!systemUser) {
    throw new Error(
      'ACT_LOG_FATAL: User hệ thống (username="system") chưa được seed. ' +
      'Chạy lại `npx tsx prisma/seed.ts` để tạo User anchor cho ActionLog. ' +
      '(Nếu A1 đã verify PASS thì lỗi này không nên xảy ra — kiểm tra seed script.)'
    );
  }

  systemUserIdCache = systemUser.id;
  return systemUser.id;
}

/**
 * Ghi 1 bản ghi ActionLog (audit trail).
 *
 * Phase 1 (Sprint 1): fire-and-forget ở ngoài transaction.
 *   - Ưu tiên: đơn giản, đủ cho compliance cơ bản.
 *   - Nhược: nếu audit fail → return 500 cho cả request CRUD (acceptable cho settings).
 * Phase 2 (nếu cần): chuyển vào Tx để rollback cùng mutation khi audit fail.
 *
 * CHÚ Ý: KHÔNG ghi log vào trong `withRowLock` transaction — tránh giữ lock quá lâu.
 *
 * @param userId - ID actor (lấy từ `requirePermissionApi()`).
 * @param actionType - CREATE | UPDATE | DELETE | AUDIT.
 * @param itemType - Loại entity (MANUFACTURER, COMPANY, ...).
 * @param itemId - ID row bị ảnh hưởng.
 * @param notes - Câu mô tả human-readable (VD: `Tạo nhà sản xuất "Dell"`).
 * @param meta - Optional { oldValues?, newValues? } để diff.
 */
export async function recordAudit(
  userId: string,
  actionType: ActionType,
  itemType: ItemType,
  itemId: string,
  notes: string,
  meta?: { oldValues?: unknown; newValues?: unknown },
): Promise<void> {
  await prisma.actionLog.create({
    data: {
      actionType,
      itemType,
      itemId,
      userId,
      notes,
      oldValues: meta?.oldValues === undefined ? undefined : (meta.oldValues as object),
      newValues: meta?.newValues === undefined ? undefined : (meta.newValues as object),
    },
  });
}
