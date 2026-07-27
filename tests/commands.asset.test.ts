/**
 * Tests cho src/lib/commands/asset.ts.
 *
 * Strategy: tạo 1 mock object giả lập Prisma TransactionClient.
 * Mỗi test setup mock trả về Asset / User / StatusLabel cụ thể,
 * gọi pure command, rồi verify:
 *  - throws NotFoundError / InvalidStateError đúng
 *  - calls update + actionLog.create đúng tham số
 *  - không có mutation ngoài 2 operation trên (no in-place)
 */
import {
  checkoutAssetToUser,
  checkinAsset,
  checkoutAssetToLocation,
} from '@/lib/commands/asset';
import { NotFoundError, InvalidStateError } from '@/lib/errors';

// --- Mock helpers ---

type TxMock = {
  asset: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
  location: {
    findUnique: jest.Mock;
  };
  actionLog: {
    create: jest.Mock;
  };
};

function makeTxMock(): TxMock {
  return {
    asset: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    location: {
      findUnique: jest.fn(),
    },
    actionLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
  };
}

const ADMIN_ID = 'admin-1';
const USER_ID = 'user-1';
const ASSET_ID = 'asset-1';
const LOC_ID = 'loc-1';

const deployableStatus = {
  id: 'status-d',
  name: 'Sẵn sàng cấp phát',
  deployable: true,
  pending: false,
  archived: false,
};
const brokenStatus = {
  id: 'status-b',
  name: 'Báo hỏng',
  deployable: false,
  pending: false,
  archived: false,
};
const activeUser = {
  id: USER_ID,
  firstName: 'Nguyễn Văn',
  lastName: 'Nhân Viên',
  activated: true,
};

// =====================================================
// checkoutAssetToUser
// =====================================================

describe('checkoutAssetToUser', () => {
  test('happy path: assign asset trống + deployable cho user active', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
      status: deployableStatus,
    });
    tx.user.findUnique.mockResolvedValue(activeUser);
    tx.asset.update.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUserId: USER_ID,
    });

    await checkoutAssetToUser(tx as never, {
      assetId: ASSET_ID,
      targetUserId: USER_ID,
      actorId: ADMIN_ID,
    });

    // update phải set assignedUserId + null 2 FK khác + checkoutCounter increment
    expect(tx.asset.update).toHaveBeenCalledTimes(1);
    const updateArgs = tx.asset.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: ASSET_ID });
    expect(updateArgs.data.assignedUserId).toBe(USER_ID);
    expect(updateArgs.data.assignedLocationId).toBeNull();
    expect(updateArgs.data.assignedAssetId).toBeNull();
    expect(updateArgs.data.checkoutCounter).toEqual({ increment: 1 });
    expect(updateArgs.data.lastCheckout).toBeInstanceOf(Date);

    // actionLog phải ghi CHECKOUT với target=USER
    expect(tx.actionLog.create).toHaveBeenCalledTimes(1);
    const logArgs = tx.actionLog.create.mock.calls[0][0];
    expect(logArgs.data.actionType).toBe('CHECKOUT');
    expect(logArgs.data.itemType).toBe('ASSET');
    expect(logArgs.data.targetType).toBe('USER');
    expect(logArgs.data.targetId).toBe(USER_ID);
    expect(logArgs.data.userId).toBe(ADMIN_ID);
  });

  test('throws NotFoundError khi asset không tồn tại', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue(null);

    await expect(
      checkoutAssetToUser(tx as never, {
        assetId: 'nonexistent',
        targetUserId: USER_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws InvalidStateError khi asset đã được gán cho user', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUserId: 'someone-else',
      assignedLocationId: null,
      assignedAssetId: null,
      status: deployableStatus,
    });

    await expect(
      checkoutAssetToUser(tx as never, {
        assetId: ASSET_ID,
        targetUserId: USER_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  test('throws InvalidStateError khi status không deployable (broken)', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-002',
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
      status: brokenStatus,
    });

    await expect(
      checkoutAssetToUser(tx as never, {
        assetId: ASSET_ID,
        targetUserId: USER_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  test('throws NotFoundError khi user không tồn tại', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
      status: deployableStatus,
    });
    tx.user.findUnique.mockResolvedValue(null);

    await expect(
      checkoutAssetToUser(tx as never, {
        assetId: ASSET_ID,
        targetUserId: 'ghost-user',
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws InvalidStateError khi user chưa activated', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
      status: deployableStatus,
    });
    tx.user.findUnique.mockResolvedValue({
      id: USER_ID,
      firstName: 'Ghost',
      lastName: 'User',
      activated: false,
    });

    await expect(
      checkoutAssetToUser(tx as never, {
        assetId: ASSET_ID,
        targetUserId: USER_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  test('nếu command throw → KHÔNG có update hoặc actionLog.create được gọi', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUserId: 'already-assigned',
      assignedLocationId: null,
      assignedAssetId: null,
      status: deployableStatus,
    });

    await expect(
      checkoutAssetToUser(tx as never, {
        assetId: ASSET_ID,
        targetUserId: USER_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);

    expect(tx.asset.update).not.toHaveBeenCalled();
    expect(tx.actionLog.create).not.toHaveBeenCalled();
  });
});

// =====================================================
// checkinAsset
// =====================================================

describe('checkinAsset', () => {
  test('happy path: thu hồi asset đang gán cho user', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUser: { firstName: 'Nguyễn', lastName: 'A' },
      assignedLocation: null,
      assignedAsset: null,
    });
    tx.asset.update.mockResolvedValue({ id: ASSET_ID, assetTag: 'LAP-001' });

    await checkinAsset(tx as never, {
      assetId: ASSET_ID,
      actorId: ADMIN_ID,
    });

    expect(tx.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ASSET_ID },
        data: expect.objectContaining({
          assignedUserId: null,
          assignedLocationId: null,
          assignedAssetId: null,
          checkinCounter: { increment: 1 },
          lastCheckin: expect.any(Date),
        }),
      })
    );

    expect(tx.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: 'CHECKIN',
          itemType: 'ASSET',
          userId: ADMIN_ID,
        }),
      })
    );
  });

  test('throws InvalidStateError khi asset đang trống', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUser: null,
      assignedLocation: null,
      assignedAsset: null,
    });

    await expect(
      checkinAsset(tx as never, {
        assetId: ASSET_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  test('throws NotFoundError khi asset không tồn tại', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue(null);

    await expect(
      checkinAsset(tx as never, {
        assetId: 'missing',
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// =====================================================
// checkoutAssetToLocation
// =====================================================

describe('checkoutAssetToLocation', () => {
  test('happy path: assign asset cho location', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
      status: deployableStatus,
    });
    tx.location.findUnique.mockResolvedValue({ id: LOC_ID, name: 'VP HN' });
    tx.asset.update.mockResolvedValue({ id: ASSET_ID, assetTag: 'LAP-001' });

    await checkoutAssetToLocation(tx as never, {
      assetId: ASSET_ID,
      targetLocationId: LOC_ID,
      actorId: ADMIN_ID,
    });

    expect(tx.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignedLocationId: LOC_ID,
          assignedUserId: null,
          assignedAssetId: null,
          checkoutCounter: { increment: 1 },
        }),
      })
    );
    expect(tx.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetType: 'LOCATION',
          targetId: LOC_ID,
        }),
      })
    );
  });

  test('throws NotFoundError khi location không tồn tại', async () => {
    const tx = makeTxMock();
    tx.asset.findUnique.mockResolvedValue({
      id: ASSET_ID,
      assetTag: 'LAP-001',
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
      status: deployableStatus,
    });
    tx.location.findUnique.mockResolvedValue(null);

    await expect(
      checkoutAssetToLocation(tx as never, {
        assetId: ASSET_ID,
        targetLocationId: 'missing',
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
