/**
 * Helper: Server-side permission guard cho Next.js route handlers.
 *
 * Pattern: throw ForbiddenError nếu thiếu quyền, ngược lại return CurrentUser.
 * Caller wrap trong try/catch + errorResponse() để convert → NextResponse.
 *
 * Ví dụ:
 *   export async function POST(req: NextRequest) {
 *     try {
 *       const user = await requirePermissionApi('assets.create')
 *       // user.id, user.firstName, user.lastName, user.email đều có sẵn
 *     } catch (e) {
 *       return errorResponse(e)
 *     }
 *   }
 *
 * Lý do KHÔNG trả union (CurrentUser | NextResponse):
 *   - Next.js 16 strict check RouteHandlerConfig mong return Promise<Response>
 *   - Union type làm Next không verify được → build fail ở validator.ts:756
 *   - Throw + errorResponse() giữ signature Response thuần, type-safe.
 */
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ForbiddenError } from '@/lib/errors'
import {
  requirePermission,
  requireAnyPermission,
  resolvePermissions,
  type ResolvedUser,
} from '@/lib/permissions'
import type { HelpdeskRole } from '@/lib/tickets/permissions'

export interface CurrentUser extends ResolvedUser {
  firstName: string
  lastName: string | null
  email: string | null
}

async function loadCurrentUserFull(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      customRoleId: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  })
  if (!row) return null
  return {
    id: row.id,
    role: row.role as HelpdeskRole,
    customRoleId: row.customRoleId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
  }
}

export async function requirePermissionApi(key: string): Promise<CurrentUser> {
  const u = await loadCurrentUserFull()
  if (!u) throw new ForbiddenError('Bạn chưa đăng nhập.')
  await requirePermission(key)
  return u
}

export async function requireAnyPermissionApi(keys: string[]): Promise<CurrentUser> {
  const u = await loadCurrentUserFull()
  if (!u) throw new ForbiddenError('Bạn chưa đăng nhập.')
  await requireAnyPermission(keys)
  return u
}

export { resolvePermissions }
export type { ResolvedUser }