/**
 * Server-side guard — drop-in replacement / supplement cho requireRole().
 *
 * Dùng cho Next.js API routes + Server Components.
 * Throw ForbiddenError nếu user thiếu permission.
 *
 * Ví dụ:
 *   await requirePermission(session.user, 'assets.create')
 *   await requireAnyPermission(session.user, ['users.manage_roles', 'settings.update'])
 */
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForbiddenError } from '@/lib/errors'
import { hasPermission, hasAnyPermission, hasAllPermissions, type ResolvedUser } from './resolve'
import prisma from '@/lib/prisma'

function sessionToUser(s: Session | null): ResolvedUser | null {
  if (!s?.user?.id) return null
  return {
    id: s.user.id,
    role: s.user.role as ResolvedUser['role'],
    customRoleId: null, // populated by loadCurrentUserWithCustomRole() if needed
  }
}

export async function currentUser(): Promise<ResolvedUser | null> {
  const s = await getServerSession(authOptions)
  return sessionToUser(s)
}

/**
 * Load user kèm customRoleId từ DB. Dùng khi cần resolve đầy đủ
 * (system role + custom role + override) — Phase 1 RBAC.
 */
export async function loadCurrentUserWithCustomRole(): Promise<ResolvedUser | null> {
  const s = await getServerSession(authOptions)
  if (!s?.user?.id) return null
  const row = await prisma.user.findUnique({
    where: { id: s.user.id },
    select: { id: true, role: true, customRoleId: true },
  })
  if (!row) return null
  return { id: row.id, role: row.role, customRoleId: row.customRoleId }
}

export async function requireSession(): Promise<ResolvedUser> {
  const u = await currentUser()
  if (!u) throw new ForbiddenError('Bạn chưa đăng nhập.')
  return u
}

export async function requirePermission(key: string): Promise<ResolvedUser> {
  const u = await loadCurrentUserWithCustomRole()
  if (!u) throw new ForbiddenError('Bạn chưa đăng nhập.')
  if (!(await hasPermission(u, key))) {
    throw new ForbiddenError(`Thiếu quyền: ${key}`, { key })
  }
  return u
}

export async function requireAnyPermission(keys: string[]): Promise<ResolvedUser> {
  const u = await loadCurrentUserWithCustomRole()
  if (!u) throw new ForbiddenError('Bạn chưa đăng nhập.')
  if (!(await hasAnyPermission(u, keys))) {
    throw new ForbiddenError(`Thiếu một trong các quyền: ${keys.join(', ')}`, { keys })
  }
  return u
}

export async function requireAllPermissions(keys: string[]): Promise<ResolvedUser> {
  const u = await loadCurrentUserWithCustomRole()
  if (!u) throw new ForbiddenError('Bạn chưa đăng nhập.')
  if (!(await hasAllPermissions(u, keys))) {
    throw new ForbiddenError(`Thiếu tất cả các quyền: ${keys.join(', ')}`, { keys })
  }
  return u
}