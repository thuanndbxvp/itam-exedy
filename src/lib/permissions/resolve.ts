/**
 * Permission resolver — Phase 1 RBAC.
 *
 * Resolution cho 1 user:
 *   1. Base = SYSTEM_ROLE_PERMISSIONS[user.role]
 *   2. Nếu user.customRoleId → merge RoleDefinition.permissions (UNION)
 *   3. Apply UserPermission override:
 *      - GRANT: thêm key vào set (nếu chưa có)
 *      - DENY: gỡ key khỏi set (kể cả khi base có)
 *   4. Bỏ qua override có expiresAt < now
 *
 * Cache: server-side cache 60s theo userId để tránh query mỗi request.
 */
import prisma from '@/lib/prisma'
import { SYSTEM_ROLE_PERMISSIONS } from './catalog'
import type { Role } from '@/lib/auth-guard'

type CachedPerms = { perms: Set<string>; expires: number }
const cache = new Map<string, CachedPerms>()
const CACHE_TTL_MS = 60_000

export interface ResolvedUser {
  id: string
  role: Role
  customRoleId: string | null
}

export async function resolvePermissions(user: ResolvedUser): Promise<Set<string>> {
  const cached = cache.get(user.id)
  if (cached && cached.expires > Date.now()) return cached.perms

  const base = new Set<string>(SYSTEM_ROLE_PERMISSIONS[user.role] ?? [])

  if (user.customRoleId) {
    const customRolePerms = await prisma.rolePermission.findMany({
      where: { roleId: user.customRoleId },
      select: { permission: { select: { key: true } } },
    })
    for (const rp of customRolePerms) base.add(rp.permission.key)
  }

  const overrides = await prisma.userPermission.findMany({
    where: {
      userId: user.id,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { effect: true, permission: { select: { key: true } } },
  })

  for (const ov of overrides) {
    if (ov.effect === 'DENY') base.delete(ov.permission.key)
    else base.add(ov.permission.key)
  }

  cache.set(user.id, { perms: base, expires: Date.now() + CACHE_TTL_MS })
  return base
}

/** Invalidate cache khi role/permission thay đổi (gọi từ API). */
export function invalidatePermissionCache(userId: string) {
  cache.delete(userId)
}

export async function hasPermission(user: ResolvedUser, key: string): Promise<boolean> {
  const perms = await resolvePermissions(user)
  return perms.has(key)
}

export async function hasAnyPermission(user: ResolvedUser, keys: string[]): Promise<boolean> {
  if (keys.length === 0) return true
  const perms = await resolvePermissions(user)
  return keys.some((k) => perms.has(k))
}

export async function hasAllPermissions(user: ResolvedUser, keys: string[]): Promise<boolean> {
  if (keys.length === 0) return true
  const perms = await resolvePermissions(user)
  return keys.every((k) => perms.has(k))
}