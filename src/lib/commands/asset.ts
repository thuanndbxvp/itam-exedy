import { Prisma } from '@prisma/client';
import { NotFoundError, InvalidStateError } from '../errors';

type Tx = Prisma.TransactionClient;

/**
 * Checkout 1 Asset cho 1 User.
 *
 * Invariants áp dụng:
 *  - #1: Status phải deployable (archived/pending/broken → refuse).
 *  - #2: Asset hiện KHÔNG được assign cho target khác (assignedUserId/LocationId/AssetId → refuse).
 *  - #3: tăng Asset.checkoutCounter, cập nhật lastCheckout.
 *  - Audit: ghi ActionLog CHECKOUT với targetType=USER.
 *
 * Throws:
 *  - NotFoundError nếu asset hoặc user không tồn tại.
 *  - InvalidStateError nếu asset không deployable / đã được gán / user chưa activated.
 *
 * Caller (server-action wrapper) PHẢI đặt hàm này trong `withRowLock('Asset', assetId, ...)`
 * để chống race-condition.
 */
export async function checkoutAssetToUser(
  tx: Tx,
  params: {
    assetId: string;
    targetUserId: string;
    actorId: string;
    notes?: string;
    expectedCheckin?: Date | null;
  }
) {
  const { assetId, targetUserId, actorId, notes, expectedCheckin } = params;

  // Lock đã được withRowLock set — giờ đọc row fresh trong cùng transaction
  const asset = await tx.asset.findUnique({
    where: { id: assetId },
    include: { status: true },
  });
  if (!asset) throw new NotFoundError('Asset', assetId);

  // Invariant #2: Asset hiện đang được gán → không checkout được
  if (asset.assignedUserId || asset.assignedLocationId || asset.assignedAssetId) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" đang được gán cho target khác. Hãy thu hồi trước khi cấp phát lại.`,
      { assetTag: asset.assetTag }
    );
  }

  // Invariant #1: Status phải deployable (status.deployable=true && !pending && !archived)
  if (!asset.status.deployable || asset.status.archived || asset.status.pending) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" có trạng thái "${asset.status.name}" — không thể cấp phát. ` +
        `Chỉ asset có trạng thái "Sẵn sàng cấp phát" (deployable=true) mới được cấp.`,
      { assetTag: asset.assetTag, statusName: asset.status.name }
    );
  }

  // Validate target user tồn tại + đã activated
  const user = await tx.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, activated: true, firstName: true, lastName: true },
  });
  if (!user) throw new NotFoundError('User', targetUserId);
  if (!user.activated) {
    throw new InvalidStateError(
      `User "${user.firstName} ${user.lastName ?? ''}" chưa được kích hoạt — không thể cấp tài sản.`
    );
  }

  // UPDATE asset — set 3 FK (chỉ 1 cái là non-null, 2 cái kia null để CHECK constraint pass)
  const updated = await tx.asset.update({
    where: { id: assetId },
    data: {
      assignedUserId: targetUserId,
      assignedLocationId: null,
      assignedAssetId: null,
      lastCheckout: new Date(),
      expectedCheckin: expectedCheckin ?? null,
      checkoutCounter: { increment: 1 },
    },
    include: { status: true, assignedUser: true },
  });

  // CREATE ActionLog — ghi trong cùng transaction để rollback nếu fail
  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'ASSET',
      itemId: assetId,
      targetType: 'USER',
      targetId: targetUserId,
      userId: actorId,
      notes:
        notes ||
        `Cấp phát asset "${asset.assetTag}" cho user "${user.firstName} ${user.lastName ?? ''}"`,
    },
  });

  return updated;
}

/**
 * Checkin 1 Asset (thu hồi về kho).
 *
 * Invariants:
 *  - Asset PHẢI đang được gán cho 1 target (nếu không → refuse, tránh checkin lung tung).
 *  - Set cả 3 FK về null.
 *  - Tăng checkinCounter, cập nhật lastCheckin.
 *  - Audit: ActionLog CHECKIN.
 */
export async function checkinAsset(
  tx: Tx,
  params: {
    assetId: string;
    actorId: string;
    notes?: string;
  }
) {
  const { assetId, actorId, notes } = params;

  const asset = await tx.asset.findUnique({
    where: { id: assetId },
    include: {
      assignedUser: { select: { firstName: true, lastName: true } },
      assignedLocation: { select: { name: true } },
      assignedAsset: { select: { assetTag: true } },
    },
  });
  if (!asset) throw new NotFoundError('Asset', assetId);

  // PHẢI đang được gán cho target nào đó
  const currentAssignee = asset.assignedUser
    ? `User "${asset.assignedUser.firstName} ${asset.assignedUser.lastName ?? ''}"`
    : asset.assignedLocation
    ? `Location "${asset.assignedLocation.name}"`
    : asset.assignedAsset
    ? `Asset "${asset.assignedAsset.assetTag}"`
    : null;

  if (!currentAssignee) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" hiện không được gán cho ai — không cần thu hồi.`
    );
  }

  // UPDATE
  const updated = await tx.asset.update({
    where: { id: assetId },
    data: {
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
      lastCheckin: new Date(),
      checkinCounter: { increment: 1 },
    },
    include: { status: true },
  });

  // ActionLog — trong cùng transaction
  await tx.actionLog.create({
    data: {
      actionType: 'CHECKIN',
      itemType: 'ASSET',
      itemId: assetId,
      userId: actorId,
      notes: notes || `Thu hồi asset "${asset.assetTag}" từ ${currentAssignee}`,
    },
  });

  return updated;
}

/**
 * Checkout Asset cho Location (thay vì User).
 * Dùng cho case "cấp phát cho phòng ban chung".
 */
export async function checkoutAssetToLocation(
  tx: Tx,
  params: {
    assetId: string;
    targetLocationId: string;
    actorId: string;
    notes?: string;
  }
) {
  const { assetId, targetLocationId, actorId, notes } = params;

  const asset = await tx.asset.findUnique({
    where: { id: assetId },
    include: { status: true },
  });
  if (!asset) throw new NotFoundError('Asset', assetId);
  if (asset.assignedUserId || asset.assignedLocationId || asset.assignedAssetId) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" đang được gán — phải thu hồi trước.`
    );
  }
  if (!asset.status.deployable || asset.status.archived || asset.status.pending) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" không deployable (status=${asset.status.name}).`
    );
  }

  const loc = await tx.location.findUnique({ where: { id: targetLocationId } });
  if (!loc) throw new NotFoundError('Location', targetLocationId);

  const updated = await tx.asset.update({
    where: { id: assetId },
    data: {
      assignedLocationId: targetLocationId,
      assignedUserId: null,
      assignedAssetId: null,
      lastCheckout: new Date(),
      checkoutCounter: { increment: 1 },
    },
    include: { status: true, assignedLocation: true },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'ASSET',
      itemId: assetId,
      targetType: 'LOCATION',
      targetId: targetLocationId,
      userId: actorId,
      notes: notes || `Cấp phát asset "${asset.assetTag}" cho location "${loc.name}"`,
    },
  });

  return updated;
}

/**
 * Checkout Asset cho Asset khác (B7).
 * Dùng cho case "chuột gán cho laptop", "dock gán cho workstation", v.v.
 *
 * Logic tương tự checkoutAssetToUser nhưng set assignedAssetId thay vì assignedUserId.
 */
export async function checkoutAssetToAsset(
  tx: Tx,
  params: {
    assetId: string;
    targetAssetId: string;
    actorId: string;
    notes?: string;
    expectedCheckin?: Date | null;
  }
) {
  const { assetId, targetAssetId, actorId, notes, expectedCheckin } = params;

  if (assetId === targetAssetId) {
    throw new InvalidStateError(
      `Asset không thể tự gán cho chính nó. Vui lòng chọn asset khác.`
    );
  }

  const asset = await tx.asset.findUnique({
    where: { id: assetId },
    include: { status: true },
  });
  if (!asset) throw new NotFoundError('Asset', assetId);

  // Asset nguồn phải rảnh
  if (asset.assignedUserId || asset.assignedLocationId || asset.assignedAssetId) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" đang được gán — phải thu hồi trước.`
    );
  }

  // Status phải deployable
  if (!asset.status.deployable || asset.status.archived || asset.status.pending) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" không deployable (status=${asset.status.name}).`
    );
  }

  // Asset đích phải tồn tại và không bị thanh lý
  const parent = await tx.asset.findUnique({
    where: { id: targetAssetId },
    select: { id: true, assetTag: true, assignedAssetId: true, status: { select: { archived: true } } },
  });
  if (!parent) throw new NotFoundError('Asset', targetAssetId);
  if (parent.status.archived) {
    throw new InvalidStateError(
      `Không thể gán vào thiết bị đã thanh lý/hủy (${parent.assetTag}).`
    );
  }

  // Phát hiện tham chiếu vòng: parent.assignedAssetId === assetId?
  if (parent.assignedAssetId === assetId) {
    throw new InvalidStateError(
      `Phát hiện tham chiếu vòng: "${parent.assetTag}" đã có thiết bị con "${asset.assetTag}".`
    );
  }

  const updated = await tx.asset.update({
    where: { id: assetId },
    data: {
      assignedAssetId: targetAssetId,
      assignedUserId: null,
      assignedLocationId: null,
      lastCheckout: new Date(),
      expectedCheckin: expectedCheckin ?? null,
      checkoutCounter: { increment: 1 },
    },
    include: { status: true, assignedAsset: true },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'ASSET',
      itemId: assetId,
      targetType: 'ASSET',
      targetId: targetAssetId,
      userId: actorId,
      notes: notes || `Cấp phát asset "${asset.assetTag}" cho thiết bị "${parent.assetTag}"`,
    },
  });

  return updated;
}
