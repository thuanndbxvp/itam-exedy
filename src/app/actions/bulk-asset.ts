'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions/guard'
import { getActorUserId } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bulkCheckoutAssets, bulkCheckinAssets } from '@/lib/commands/bulk-asset'
import type { CommandResult } from '@/lib/errors'
import type { BulkOperationResult } from '@/lib/commands/bulk-asset'
import { runCommand } from '@/lib/commands/runCommand'

export async function bulkCheckoutAction(params: {
  assetIds: string[]
  targetUserId: string
  notes?: string
}): Promise<CommandResult<BulkOperationResult>> {
  return runCommand(async () => {
    await requirePermission('assets.checkout')

    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)

    const result = await bulkCheckoutAssets(
      params.assetIds,
      params.targetUserId,
      actorId,
      params.notes
    )

    revalidatePath('/assets')
    return result
  }, 'bulkCheckoutAction')
}

export async function bulkCheckinAction(params: {
  assetIds: string[]
  notes?: string
}): Promise<CommandResult<BulkOperationResult>> {
  return runCommand(async () => {
    await requirePermission('assets.checkin')

    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)

    const result = await bulkCheckinAssets(params.assetIds, actorId, params.notes)

    revalidatePath('/assets')
    return result
  }, 'bulkCheckinAction')
}