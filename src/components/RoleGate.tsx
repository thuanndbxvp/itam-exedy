'use client'

import { useSession } from 'next-auth/react'
import type { Role } from '@/lib/auth-guard'

interface RoleGateProps {
  allowedRoles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Pure predicate: cho biết 1 session có role nằm trong allowedRoles không.
 *
 * Tách ra để có thể unit-test mà KHÔNG cần React Testing Library
 * (workspace rule: KHÔNG thêm dependency mới).
 *
 * Phase 1: chỉ dùng để ẨN UI (button, link, menu item).
 * KHÔNG dùng để enforce security — server-side đã có `requireRole()` ở `src/lib/auth-guard.ts`.
 *
 * Ví dụ:
 *   <RoleGate allowedRoles={['ADMIN']}>
 *     <Button>Checkout Asset</Button>
 *   </RoleGate>
 */
export function isRoleAllowed(
  sessionRole: Role | null | undefined,
  allowedRoles: Role[]
): boolean {
  if (!sessionRole) return false
  return allowedRoles.includes(sessionRole)
}

/**
 * Chỉ render `children` nếu session.user.role nằm trong `allowedRoles`.
 */
export default function RoleGate({
  allowedRoles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { data: session, status } = useSession()

  // Loading: chưa có session → render fallback (ẩn defensive).
  if (status === 'loading') return <>{fallback}</>

  // Unauthenticated: middleware đã redirect, defensive fallback.
  if (!session?.user?.role) return <>{fallback}</>

  if (!isRoleAllowed(session.user.role, allowedRoles)) return <>{fallback}</>

  return <>{children}</>
}