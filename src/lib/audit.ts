import prisma from "@/lib/prisma";

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
