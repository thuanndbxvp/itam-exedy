/**
 * Asset Status Sync Engine — Sprint C.11
 *
 * Tự động đồng bộ trạng thái Asset khi:
 * - Tạo phiếu sửa chữa (REPAIR) → Asset status = REPAIR
 * - Hoàn thành phiếu sửa chữa → Asset status = DEPLOYABLE
 *
 * Status Flow:
 *   DEPLOYABLE ◄────────────────────────────┐
 *       │                                    │
 *       │ (Tạo phiếu sửa chữa)            │
 *       ▼                                    │
 *   REPAIR/MAINTENANCE ──────────────────────┤
 *       │                                    │
 *       │ (Đóng phiếu)                    │
 *       ▼                                    │
 *   DEPLOYABLE ──────────────────────────────┘
 */

import prisma from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { recalculateHealthScore } from '@/lib/health-score';
import type { ActionType, ItemType } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Asset status tương ứng với trạng thái sửa chữa.
 * Map với StatusLabel.deployable = true/false
 */
export type AssetWorkStatus = 'DEPLOYABLE' | 'MAINTENANCE' | 'REPAIR';

export interface SyncResult {
  assetId: string;
  previousStatus: string | null;
  newStatus: string | null;
  healthScore: number | null;
  recommendation: 'replace' | 'monitor' | 'continue';
}

// ============================================================================
// CORE SYNC FUNCTION
// ============================================================================

/**
 * Đếm số phiếu sửa chữa đang PENDING/IN_PROGRESS của asset.
 */
export async function countPendingMaintenances(assetId: string): Promise<number> {
  return prisma.assetMaintenance.count({
    where: {
      assetId,
      deletedAt: null,
      OR: [
        { completionDate: null }, // Chưa hoàn thành
        { completionDate: { gt: new Date() } }, // Completion date trong tương lai
      ],
    },
  });
}

/**
 * Xác định trạng thái work của asset dựa trên phiếu sửa chữa.
 */
export function determineWorkStatus(pendingCount: number): AssetWorkStatus {
  if (pendingCount > 0) {
    return 'MAINTENANCE'; // Có phiếu đang chờ/xử lý
  }
  return 'DEPLOYABLE'; // Không có phiếu nào → sẵn sàng
}

/**
 * Lấy StatusLabel ID cho trạng thái work.
 * Tìm theo name: 'Deployable', 'Maintenance', 'Repair'
 */
export async function getStatusLabelId(status: AssetWorkStatus): Promise<string | null> {
  const statusMap: Record<AssetWorkStatus, string> = {
    DEPLOYABLE: 'Deployable',
    MAINTENANCE: 'Maintenance',
    REPAIR: 'Repair',
  };

  const statusLabel = await prisma.statusLabel.findFirst({
    where: { name: statusMap[status] },
    select: { id: true },
  });

  return statusLabel?.id ?? null;
}

/**
 * Core sync function — gọi sau mỗi mutation trên AssetMaintenance.
 * - Đếm phiếu PENDING/IN_PROGRESS
 * - Đổi status của Asset nếu cần
 * - Recalculate Health Score
 */
export async function syncAssetWorkStatus(
  assetId: string,
  options?: {
    userId?: string;
    auditNotes?: string;
    forceHealthRecalc?: boolean;
  }
): Promise<SyncResult> {
  // 1. Đếm phiếu đang chờ
  const pendingCount = await countPendingMaintenances(assetId);
  const workStatus = determineWorkStatus(pendingCount);

  // 2. Lấy current asset
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { statusId: true, name: true, assetTag: true },
  });

  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  const previousStatusId = asset.statusId;

  // 3. Lấy target status label ID
  const targetStatusId = await getStatusLabelId(workStatus);

  if (!targetStatusId) {
    console.warn(`[AssetStatusSync] StatusLabel not found for: ${workStatus}`);
    // Fallback: không đổi status
    const healthResult = options?.forceHealthRecalc
      ? await recalculateHealthScore(assetId)
      : await getCachedHealthScore(assetId);

    return {
      assetId,
      previousStatus: previousStatusId,
      newStatus: previousStatusId,
      healthScore: healthResult?.score ?? null,
      recommendation: healthResult?.recommendation ?? 'continue',
    };
  }

  // 4. Chỉ update nếu status thay đổi
  let newStatusId = previousStatusId;
  if (targetStatusId !== previousStatusId) {
    await prisma.asset.update({
      where: { id: assetId },
      data: { statusId: targetStatusId },
    });
    newStatusId = targetStatusId;

    // Audit log
    if (options?.userId) {
      await recordAudit(
        options.userId,
        workStatus === 'DEPLOYABLE' ? 'MAINTENANCE_ENDED' : 'MAINTENANCE_STARTED',
        'ASSET',
        assetId,
        options.auditNotes ?? `${asset.assetTag} — ${workStatus === 'DEPLOYABLE' ? 'Kết thúc bảo trì' : 'Bắt đầu bảo trì'}`,
        {
          oldValues: { statusId: previousStatusId },
          newValues: { statusId: targetStatusId },
        }
      );
    }
  }

  // 5. Recalculate Health Score (sau mỗi maintenance mutation)
  const healthResult = await recalculateHealthScore(assetId);

  return {
    assetId,
    previousStatus: previousStatusId,
    newStatus: newStatusId,
    healthScore: healthResult?.score ?? null,
    recommendation: healthResult?.recommendation ?? 'continue',
  };
}

/**
 * Lấy cached Health Score (không recalc).
 */
async function getCachedHealthScore(assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { healthScore: true },
  });
  return asset?.healthScore ? { score: asset.healthScore, recommendation: 'continue' as const } : null;
}

// ============================================================================
// MAINTENANCE MUTATION HOOKS
// ============================================================================

/**
 * Hook: Gọi sau khi tạo phiếu sửa chữa mới.
 */
export async function onMaintenanceCreated(
  assetId: string,
  userId?: string,
  maintenanceTitle?: string
): Promise<SyncResult> {
  return syncAssetWorkStatus(assetId, {
    userId,
    auditNotes: maintenanceTitle ? `Tạo phiếu: ${maintenanceTitle}` : 'Tạo phiếu sửa chữa mới',
    forceHealthRecalc: true,
  });
}

/**
 * Hook: Gọi sau khi cập nhật phiếu sửa chữa.
 * Chỉ recalc nếu thay đổi completionDate.
 */
export async function onMaintenanceUpdated(
  assetId: string,
  userId?: string,
  changes?: { completionDate?: { from: Date | null; to: Date | null } }
): Promise<SyncResult> {
  // Nếu vừa set completionDate → coi như hoàn thành
  const justCompleted = changes?.completionDate?.from === null && changes.completionDate.to !== null;

  return syncAssetWorkStatus(assetId, {
    userId,
    auditNotes: justCompleted ? 'Hoàn thành phiếu sửa chữa' : 'Cập nhật phiếu sửa chữa',
    forceHealthRecalc: true,
  });
}

/**
 * Hook: Gọi sau khi xóa phiếu sửa chữa.
 */
export async function onMaintenanceDeleted(
  assetId: string,
  userId?: string,
  maintenanceTitle?: string
): Promise<SyncResult> {
  return syncAssetWorkStatus(assetId, {
    userId,
    auditNotes: maintenanceTitle ? `Xóa phiếu: ${maintenanceTitle}` : 'Xóa phiếu sửa chữa',
    forceHealthRecalc: true,
  });
}

// ============================================================================
// MAINTENANCE COST TRACKING
// ============================================================================

/**
 * Cập nhật repairCount và totalRepairCost của Asset.
 * Gọi khi tạo/cập nhật/xóa maintenance.
 */
export async function updateMaintenanceStats(assetId: string): Promise<void> {
  // Tính tổng từ tất cả phiếu đã hoàn thành
  const stats = await prisma.assetMaintenance.aggregate({
    where: {
      assetId,
      deletedAt: null,
      completionDate: { not: null }, // Chỉ đếm phiếu đã hoàn thành
    },
    _count: { _all: true },
    _sum: { cost: true },
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      repairCount: stats._count._all,
      totalRepairCost: stats._sum.cost ?? null,
    },
  });
}

// ============================================================================
// ASSET WORK STATUS QUERY
// ============================================================================

/**
 * Lấy tất cả assets đang ở trạng thái bảo trì.
 */
export async function getAssetsInMaintenance(): Promise<string[]> {
  const statusLabel = await prisma.statusLabel.findFirst({
    where: { name: 'Maintenance' },
    select: { id: true },
  });

  if (!statusLabel) return [];

  const assets = await prisma.asset.findMany({
    where: { statusId: statusLabel.id, deletedAt: null },
    select: { id: true },
  });

  return assets.map(a => a.id);
}

/**
 * Kiểm tra asset có đang trong trạng thái bảo trì không.
 */
export async function isAssetInMaintenance(assetId: string): Promise<boolean> {
  const statusLabel = await prisma.statusLabel.findFirst({
    where: { name: 'Maintenance' },
    select: { id: true },
  });

  if (!statusLabel) return false;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { statusId: true },
  });

  return asset?.statusId === statusLabel.id;
}
