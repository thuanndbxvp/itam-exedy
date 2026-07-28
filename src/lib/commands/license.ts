import { Prisma } from '@prisma/client';
import { NotFoundError, InvalidStateError } from '../errors';

type Tx = Prisma.TransactionClient;

/**
 * Checkout 1 LicenseSeat cho 1 User.
 *
 * Invariants:
 *  - LicenseSeat PHẢI còn trống (assignedUserId=NULL và assignedAssetId=NULL).
 *  - License phải chưa hết hạn HOẶC nếu reassignable=true thì OK cả khi expired.
 *  - User PHẢI tồn tại và activated=true.
 *  - Audit: ActionLog CHECKOUT với itemType=LICENSE_SEAT, targetType=USER.
 *
 * Naming convention: dùng "checkout/checkin" thống nhất với asset commands
 * (xem commands/asset.ts) để UI Epic D có cùng verb cho cả 2 domain.
 *
 * Caller PHẢI đặt hàm này trong `withRowLock('LicenseSeat', seatId, ...)`.
 */
export async function checkoutLicenseSeat(
  tx: Tx,
  params: {
    seatId: string;
    targetUserId?: string;
    targetAssetId?: string;
    actorId: string;
    notes?: string;
  }
) {
  const { seatId, targetUserId, targetAssetId, actorId, notes } = params;

  if (!targetUserId && !targetAssetId) {
    throw new InvalidStateError('Phải chọn Nhân viên hoặc Thiết bị để cấp phát.');
  }
  if (targetUserId && targetAssetId) {
    throw new InvalidStateError('Chỉ được chọn 1 trong 2: Nhân viên HOẶC Thiết bị.');
  }

  const seat = await tx.licenseSeat.findUnique({
    where: { id: seatId },
    include: {
      license: true,
      assignedUser: { select: { firstName: true, lastName: true } },
      assignedAsset: { select: { assetTag: true, name: true } },
    },
  });
  if (!seat) throw new NotFoundError('LicenseSeat', seatId);

  if (seat.assignedUserId || seat.assignedAssetId) {
    const current = seat.assignedUser
      ? `user "${seat.assignedUser.firstName} ${seat.assignedUser.lastName ?? ''}"`
      : `asset "${seat.assignedAsset?.assetTag ?? '?'}"`;
    throw new InvalidStateError(
      `Seat #${seat.id.slice(-6)} đã được gán cho ${current} — thu hồi trước khi cấp phát lại.`
    );
  }

  if (
    seat.license.expirationDate &&
    seat.license.expirationDate < new Date() &&
    !seat.license.reassignable
  ) {
    throw new InvalidStateError(
      `License "${seat.license.name}" đã hết hạn và KHÔNG reassignable — không thể cấp seat mới.`
    );
  }

  let targetName = '';
  if (targetUserId) {
    const user = await tx.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, activated: true, firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundError('User', targetUserId);
    if (!user.activated) {
      throw new InvalidStateError(`User chưa kích hoạt — không thể cấp license seat.`);
    }
    targetName = `user "${user.firstName} ${user.lastName ?? ''}"`;
  } else if (targetAssetId) {
    const asset = await tx.asset.findUnique({
      where: { id: targetAssetId },
      select: { id: true, assetTag: true, name: true, status: { select: { archived: true } } },
    });
    if (!asset) throw new NotFoundError('Asset', targetAssetId);
    if (asset.status.archived) {
      throw new InvalidStateError(`Không thể gán vào thiết bị đã thanh lý/hủy (${asset.assetTag}).`);
    }
    targetName = `asset "${asset.assetTag} - ${asset.name}"`;
  }

  // HOTFIX: chan 1 user/asset nhan 2 seat cung 1 licenseId.
  // Neu target da co 1 seat khac (con ton tai) cua licenseId nay → InvalidStateError.
  // Bo qua seatId hien tai (de phong race check-then-update qua row-lock).
  const duplicateWhere: Prisma.LicenseSeatWhereInput = {
    licenseId: seat.licenseId,
    deletedAt: null,
    id: { not: seatId },
  };
  if (targetUserId) {
    duplicateWhere.assignedUserId = targetUserId;
  } else if (targetAssetId) {
    duplicateWhere.assignedAssetId = targetAssetId;
  }
  const existingDup = await tx.licenseSeat.findFirst({
    where: duplicateWhere,
    select: {
      id: true,
      assignedUser: { select: { firstName: true, lastName: true } },
      assignedAsset: { select: { assetTag: true } },
    },
  });
  if (existingDup) {
    const holder = existingDup.assignedUser
      ? `user "${existingDup.assignedUser.firstName} ${existingDup.assignedUser.lastName ?? ''}"`
      : existingDup.assignedAsset
        ? `thiết bị "${existingDup.assignedAsset.assetTag}"`
        : 'đối tượng khác';
    throw new InvalidStateError(
      `License "${seat.license.name}" đã được cấp phát cho ${holder} — Mỗi nhân sự / thiết bị chỉ nhận 1 seat cho cùng 1 bản quyền (trừ khi license có nhiều dòng sản phẩm). Thu hồi seat cũ trước khi cấp seat mới.`,
    );
  }

  const updated = await tx.licenseSeat.update({
    where: { id: seatId },
    data: {
      assignedUserId: targetUserId || null,
      assignedAssetId: targetAssetId || null,
    },
    include: { license: true, assignedUser: true, assignedAsset: true },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'LICENSE_SEAT',
      itemId: seatId,
      targetType: targetUserId ? 'USER' : 'ASSET',
      targetId: targetUserId || targetAssetId,
      userId: actorId,
      notes: notes || `Cấp phát LicenseSeat của "${seat.license.name}" cho ${targetName}`,
    },
  });

  return updated;
}

/**
 * Checkin 1 LicenseSeat (giải phóng seat về pool trống).
 *
 * Invariants:
 *  - Seat PHẢI đang được gán (nếu đang trống → refuse, tránh checkin lung tung).
 *  - Set cả 2 FK nullable về null.
 *  - Audit: ActionLog CHECKIN với itemType=LICENSE_SEAT.
 *
 * Naming convention: dùng "checkout/checkin" thống nhất với asset commands
 * (xem commands/asset.ts) để UI Epic D có cùng verb cho cả 2 domain.
 */
export async function checkinLicenseSeat(
  tx: Tx,
  params: {
    seatId: string;
    actorId: string;
    notes?: string;
  }
) {
  const { seatId, actorId, notes } = params;

  const seat = await tx.licenseSeat.findUnique({
    where: { id: seatId },
    include: {
      license: true,
      assignedUser: { select: { firstName: true, lastName: true } },
      assignedAsset: { select: { assetTag: true } },
    },
  });
  if (!seat) throw new NotFoundError('LicenseSeat', seatId);

  const currentAssignee = seat.assignedUser
    ? `user "${seat.assignedUser.firstName} ${seat.assignedUser.lastName ?? ''}"`
    : seat.assignedAsset
    ? `asset "${seat.assignedAsset.assetTag}"`
    : null;

  if (!currentAssignee) {
    throw new InvalidStateError(
      `Seat #${seat.id.slice(-6)} đang trống — không cần thu hồi.`
    );
  }

  const updated = await tx.licenseSeat.update({
    where: { id: seatId },
    data: {
      assignedUserId: null,
      assignedAssetId: null,
    },
    include: { license: true },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKIN',
      itemType: 'LICENSE_SEAT',
      itemId: seatId,
      userId: actorId,
      notes: notes || `Thu hồi LicenseSeat (${seat.license.name}) từ ${currentAssignee}`,
    },
  });

  return updated;
}

/**
 * Expire (đánh dấu expired) 1 LicenseSeat — set `unreassignableSeat=true` và log.
 * Dùng khi license bị thu hồi từ supplier, seat đã cấp không còn dùng được nữa.
 */
export async function expireLicenseSeat(
  tx: Tx,
  params: {
    seatId: string;
    actorId: string;
    reason?: string;
  }
) {
  const { seatId, actorId, reason } = params;

  const seat = await tx.licenseSeat.findUnique({
    where: { id: seatId },
    include: {
      license: true,
      assignedUser: { select: { firstName: true, lastName: true } },
    },
  });
  if (!seat) throw new NotFoundError('LicenseSeat', seatId);

  if (seat.unreassignableSeat) {
    throw new InvalidStateError(
      `Seat #${seat.id.slice(-6)} đã được đánh dấu expired trước đó.`
    );
  }

  const updated = await tx.licenseSeat.update({
    where: { id: seatId },
    data: {
      unreassignableSeat: true,
      // Nếu seat đang assign cho user/asset thì cũng giải phóng luôn
      assignedUserId: null,
      assignedAssetId: null,
    },
    include: { license: true },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'UPDATE',
      itemType: 'LICENSE_SEAT',
      itemId: seatId,
      userId: actorId,
      notes: reason || `Đánh dấu expired LicenseSeat (${seat.license.name})`,
    },
  });

  return updated;
}

/**
 * Create License + nested N seats (atomic transaction).
 * KHÔNG cần row-lock (tạo mới, không có target row để lock).
 * Tuy nhiên vẫn wrap trong transaction để CREATE License + CREATE N seats atomic.
 */
export async function createLicenseWithSeats(
  tx: Tx,
  params: {
    name: string;
    productKey?: string | null;
    seatCount: number;
    actorId: string;
  }
) {
  const { name, productKey, seatCount, actorId } = params;

  if (!name.trim()) {
    throw new InvalidStateError('Tên license không được để trống.');
  }
  const safeSeatCount = Math.max(1, Math.floor(seatCount ?? 1));

  const license = await tx.license.create({
    data: {
      name: name.trim(),
      productKey: productKey?.trim() || null,
      seats: {
        create: Array.from({ length: safeSeatCount }).map(() => ({
          notes: 'Auto-created seat',
        })),
      },
    },
    include: { seats: true },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CREATE',
      itemType: 'LICENSE',
      itemId: license.id,
      userId: actorId,
      notes: `Tạo mới bản quyền "${license.name}" (${safeSeatCount} seats)`,
    },
  });

  return license;
}
