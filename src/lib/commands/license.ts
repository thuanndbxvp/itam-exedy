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
export async function checkoutLicenseSeatToUser(
  tx: Tx,
  params: {
    seatId: string;
    targetUserId: string;
    actorId: string;
    notes?: string;
  }
) {
  const { seatId, targetUserId, actorId, notes } = params;

  const seat = await tx.licenseSeat.findUnique({
    where: { id: seatId },
    include: {
      license: true,
      assignedUser: { select: { firstName: true, lastName: true } },
      assignedAsset: { select: { assetTag: true } },
    },
  });
  if (!seat) throw new NotFoundError('LicenseSeat', seatId);

  // Invariant: seat phải còn trống
  if (seat.assignedUserId || seat.assignedAssetId) {
    const current = seat.assignedUser
      ? `user "${seat.assignedUser.firstName} ${seat.assignedUser.lastName ?? ''}"`
      : `asset "${seat.assignedAsset?.assetTag ?? '?'}"`;
    throw new InvalidStateError(
      `Seat #${seat.id.slice(-6)} đã được gán cho ${current} — thu hồi trước khi cấp phát lại.`
    );
  }

  // Validate License chưa hết hạn (trừ khi reassignable=true)
  if (
    seat.license.expirationDate &&
    seat.license.expirationDate < new Date() &&
    !seat.license.reassignable
  ) {
    throw new InvalidStateError(
      `License "${seat.license.name}" đã hết hạn và KHÔNG reassignable — không thể cấp seat mới.`
    );
  }

  const user = await tx.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, activated: true, firstName: true, lastName: true },
  });
  if (!user) throw new NotFoundError('User', targetUserId);
  if (!user.activated) {
    throw new InvalidStateError(
      `User "${user.firstName} ${user.lastName ?? ''}" chưa kích hoạt — không thể cấp license seat.`
    );
  }

  const updated = await tx.licenseSeat.update({
    where: { id: seatId },
    data: {
      assignedUserId: targetUserId,
      assignedAssetId: null,
    },
    include: {
      license: true,
      assignedUser: true,
    },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'LICENSE_SEAT',
      itemId: seatId,
      targetType: 'USER',
      targetId: targetUserId,
      userId: actorId,
      notes:
        notes ||
        `Cấp phát LicenseSeat của "${seat.license.name}" cho user "${user.firstName} ${user.lastName ?? ''}"`,
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
