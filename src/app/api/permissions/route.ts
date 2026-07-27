/**
 * GET /api/permissions — trả về permission catalog (cho UI matrix).
 */
import { NextResponse } from 'next/server'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { PERMISSIONS } from '@/lib/permissions/catalog'

export async function GET() {
  try {
    await requirePermissionApi('users.manage_roles')
    return okResponse(PERMISSIONS)
  } catch (e) {
    return errorResponse(e)
  }
}