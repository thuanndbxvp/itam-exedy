/**
 * GET /api/users/export — Export users to CSV.
 *
 * Sprint B15.1: HR-style roll cho admin.
 *
 * Query params:
 *   - role: filter by role (ADMIN/IT_STAFF/IT_MANAGER/EMPLOYEE)
 *   - activated: 'true' | 'false' | 'all' (default 'all')
 *   - search: case-insensitive contains on firstName/lastName/email/username
 *
 * Returns: text/csv với UTF-8 BOM + CRLF rows.
 * Permission: users.read.
 */
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { buildCsv, csvResponse, formatCsvDate, formatCsvBool } from '@/lib/csv'

const ALLOWED_ROLES = new Set(['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'])

export async function GET(request: NextRequest) {
  try {
    await requirePermissionApi('users.read')
  } catch (e) {
    return errorResponse(e)
  }

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const activated = searchParams.get('activated')
  const search = searchParams.get('search')?.trim() ?? ''

  const where: Record<string, unknown> = {
    deletedAt: null,
  }
  if (role && ALLOWED_ROLES.has(role)) {
    where.role = role
  }
  if (activated === 'true') where.activated = true
  else if (activated === 'false') where.activated = false
  if (search.length > 0) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' as const } },
      { lastName: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { username: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    include: {
      company: { select: { name: true } },
      department: { select: { name: true } },
      manager: { select: { firstName: true, lastName: true } },
    },
  })

  const headers = [
    'ID',
    'Username',
    'Email',
    'FirstName',
    'LastName',
    'FullName',
    'Role',
    'Activated',
    'JobTitle',
    'Company',
    'Department',
    'Manager',
    'EmployeeNumber',
    'Phone',
    'CreatedAt',
  ]

  const rows = users.map((u) => {
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
    const managerName = u.manager
      ? `${u.manager.firstName}${u.manager.lastName ? ' ' + u.manager.lastName : ''}`.trim()
      : ''
    return [
      u.id,
      u.username ?? '',
      u.email ?? '',
      u.firstName,
      u.lastName ?? '',
      fullName,
      u.role,
      formatCsvBool(u.activated),
      u.jobTitle ?? '',
      u.company?.name ?? '',
      u.department?.name ?? '',
      managerName,
      u.employeeNum ?? '',
      u.phone ?? '',
      formatCsvDate(u.createdAt),
    ]
  })

  const csv = buildCsv(headers, rows)
  const today = new Date().toISOString().split('T')[0]
  return csvResponse(`users-export-${today}.csv`, csv)
}
