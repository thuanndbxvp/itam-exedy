/**
 * Logic check authentication — extract từ middleware authorized callback.
 *
 * Tại sao tách: middleware chạy Edge runtime khó test với Jest.
 * Pure function này dễ unit-test, dùng cho cả middleware + test.
 *
 * Phase 1: chỉ check token tồn tại.
 * Phase 2: check thêm token.role để phân quyền.
 */
export function isAuthorized(token: { id?: string } | null | undefined): boolean {
  return !!token
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ForbiddenError } from '@/lib/errors';

/**
 * Type alias cho role — sync với src/types/next-auth.d.ts Session.user.role.
 * Phase 1: chỉ 2 role. Phase 2 sẽ mở rộng.
 */
export type Role = 'ADMIN' | 'EMPLOYEE';

/**
 * Check user hiện tại có role cho phép không.
 * Throw ForbiddenError nếu KHÔNG — caller (server action) sẽ catch → return CommandResult.
 *
 * @param role - Role bắt buộc (vd: 'ADMIN')
 * @throws ForbiddenError nếu session không có hoặc role không match
 *
 * Ví dụ:
 *   await requireRole('ADMIN')      // chỉ ADMIN
 *   await requireRole('EMPLOYEE')   // chỉ EMPLOYEE
 */
export async function requireRole(role: Role): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.role) {
    throw new ForbiddenError(
      'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.',
      { requiredRole: role }
    );
  }

  if (session.user.role !== role) {
    throw new ForbiddenError(
      `Bạn không có quyền thực hiện hành động này. Yêu cầu role: ${role} — Role hiện tại: ${session.user.role}.`,
      { requiredRole: role, currentRole: session.user.role, userId: session.user.id }
    );
  }
}
