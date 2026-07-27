/**
 * Bulk Asset Commands — G-1, G-2
 *
 * Bulk checkout/checkin với summary result.
 * Mỗi item được xử lý độc lập (không shared transaction).
 * Nếu item N fail, item N+1 vẫn tiếp tục.
 */
import { withRowLock } from '@/lib/locking'
import { checkoutAssetToUser, checkinAsset } from './asset'
import { NotFoundError } from '../errors'

export interface BulkItemResult {
  id: string
  assetTag: string
  ok: boolean
  code?: string
  message?: string
}

export interface BulkOperationResult {
  total: number
  success: number
  failed: number
  results: BulkItemResult[]
}

/**
 * Bulk checkout nhiều assets cho 1 user.
 */
export async function bulkCheckoutAssets(
  assetIds: string[],
  targetUserId: string,
  actorId: string,
  notes?: string
): Promise<BulkOperationResult> {
  const results: BulkItemResult[] = []

  for (const assetId of assetIds) {
    try {
      const result = await withRowLock('Asset', assetId, (tx) =>
        checkoutAssetToUser(tx, {
          assetId,
          targetUserId,
          actorId,
          notes,
        })
      )
      results.push({
        id: assetId,
        assetTag: result.assetTag,
        ok: true,
      })
    } catch (e) {
      const error = e as Error
      const assetTag = error instanceof NotFoundError
        ? (error.meta as { entityName?: string })?.entityName ?? assetId
        : assetId
      results.push({
        id: assetId,
        assetTag: String(assetTag),
        ok: false,
        code: error.name,
        message: error.message,
      })
    }
  }

  return {
    total: results.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  }
}

/**
 * Bulk checkin nhiều assets.
 */
export async function bulkCheckinAssets(
  assetIds: string[],
  actorId: string,
  notes?: string
): Promise<BulkOperationResult> {
  const results: BulkItemResult[] = []

  for (const assetId of assetIds) {
    try {
      await withRowLock('Asset', assetId, (tx) =>
        checkinAsset(tx, {
          assetId,
          actorId,
          notes,
        })
      )
      results.push({
        id: assetId,
        assetTag: assetId,
        ok: true,
      })
    } catch (e) {
      const error = e as Error
      const assetTag = error instanceof NotFoundError
        ? (error.meta as { entityName?: string })?.entityName ?? assetId
        : assetId
      results.push({
        id: assetId,
        assetTag: String(assetTag),
        ok: false,
        code: error.name,
        message: error.message,
      })
    }
  }

  return {
    total: results.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  }
}
