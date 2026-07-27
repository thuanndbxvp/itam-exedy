'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth-guard'
import { getActorUserId } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bulkCheckoutAssets, bulkCheckinAssets } from '@/lib/commands/bulk-asset'
import type { CommandResult } from '@/lib/errors'
import type { BulkOperationResult } from '@/lib/commands/bulk-asset'

export async function bulkCheckoutAction(params: {
  assetIds: string[]
  targetUserId: string
  notes?: string
}): Promise<CommandResult<BulkOperationResult>> {
  try {
    await requireRole('ADMIN')

    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)

    const result = await bulkCheckoutAssets(
      params.assetIds,
      params.targetUserId,
      actorId,
      params.notes
    )

    revalidatePath('/assets')
    return { ok: true, data: result }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[bulkCheckout]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi checkout nhiều asset.' }
  }
}

export async function bulkCheckinAction(params: {
  assetIds: string[]
  notes?: string
}): Promise<CommandResult<BulkOperationResult>> {
  try {
    await requireRole('ADMIN')

    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)

    const result = await bulkCheckinAssets(params.assetIds, actorId, params.notes)

    revalidatePath('/assets')
    return { ok: true, data: result }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[bulkCheckin]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi checkin nhiều asset.' }
  }
}
