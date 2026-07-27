/**
 * Tests cho src/lib/commands/license.ts.
 *
 * Strategy: tương tự commands/asset — mock TransactionClient.
 */
import {
  checkoutLicenseSeatToUser,
  checkinLicenseSeat,
  expireLicenseSeat,
  createLicenseWithSeats,
} from '@/lib/commands/license';
import { NotFoundError, InvalidStateError } from '@/lib/errors';

// --- Mock helpers ---

type TxMock = {
  licenseSeat: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  license: {
    create: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
  actionLog: {
    create: jest.Mock;
  };
};

function makeTxMock(): TxMock {
  return {
    licenseSeat: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    license: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    actionLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
  };
}

const ADMIN_ID = 'admin-1';
const USER_ID = 'user-1';
const SEAT_ID = 'seat-1';

const activeUser = {
  id: USER_ID,
  firstName: 'Nguyễn Văn',
  lastName: 'A',
  activated: true,
};

const baseLicense = {
  id: 'lic-1',
  name: 'Office 365',
  expirationDate: new Date('2027-12-31'),
  reassignable: true,
};

// =====================================================
// checkoutLicenseSeatToUser (renamed từ assignLicenseSeatToUser)
// =====================================================

describe('checkoutLicenseSeatToUser', () => {
  test('happy path: gán seat trống cho user active', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue({
      id: SEAT_ID,
      license: baseLicense,
      assignedUserId: null,
      assignedAssetId: null,
      assignedUser: null,
      assignedAsset: null,
    });
    tx.user.findUnique.mockResolvedValue(activeUser);
    tx.licenseSeat.update.mockResolvedValue({ id: SEAT_ID });

    await checkoutLicenseSeatToUser(tx as never, {
      seatId: SEAT_ID,
      targetUserId: USER_ID,
      actorId: ADMIN_ID,
    });

    expect(tx.licenseSeat.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SEAT_ID },
        data: expect.objectContaining({
          assignedUserId: USER_ID,
          assignedAssetId: null,
        }),
      })
    );
    expect(tx.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: 'CHECKOUT',
          itemType: 'LICENSE_SEAT',
          targetType: 'USER',
          targetId: USER_ID,
        }),
      })
    );
  });

  test('throws InvalidStateError khi seat đang gán cho user khác', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue({
      id: SEAT_ID,
      license: baseLicense,
      assignedUserId: 'someone-else',
      assignedAssetId: null,
      assignedUser: { firstName: 'Other', lastName: 'User' },
      assignedAsset: null,
    });

    await expect(
      checkoutLicenseSeatToUser(tx as never, {
        seatId: SEAT_ID,
        targetUserId: USER_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  test('throws InvalidStateError khi license expired VÀ not reassignable', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue({
      id: SEAT_ID,
      license: {
        ...baseLicense,
        expirationDate: new Date('2020-01-01'),
        reassignable: false,
      },
      assignedUserId: null,
      assignedAssetId: null,
      assignedUser: null,
      assignedAsset: null,
    });

    await expect(
      checkoutLicenseSeatToUser(tx as never, {
        seatId: SEAT_ID,
        targetUserId: USER_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  test('throws NotFoundError khi seat không tồn tại', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue(null);

    await expect(
      checkoutLicenseSeatToUser(tx as never, {
        seatId: 'missing',
        targetUserId: USER_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws NotFoundError khi user không tồn tại', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue({
      id: SEAT_ID,
      license: baseLicense,
      assignedUserId: null,
      assignedAssetId: null,
      assignedUser: null,
      assignedAsset: null,
    });
    tx.user.findUnique.mockResolvedValue(null);

    await expect(
      checkoutLicenseSeatToUser(tx as never, {
        seatId: SEAT_ID,
        targetUserId: 'ghost',
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// =====================================================
// checkinLicenseSeat (renamed từ revokeLicenseSeat)
// =====================================================

describe('checkinLicenseSeat', () => {
  test('happy path: thu hồi seat đang gán cho user', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue({
      id: SEAT_ID,
      license: baseLicense,
      assignedUser: { firstName: 'A', lastName: 'B' },
      assignedAsset: null,
    });
    tx.licenseSeat.update.mockResolvedValue({ id: SEAT_ID });

    await checkinLicenseSeat(tx as never, {
      seatId: SEAT_ID,
      actorId: ADMIN_ID,
    });

    expect(tx.licenseSeat.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignedUserId: null,
          assignedAssetId: null,
        }),
      })
    );
    expect(tx.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actionType: 'CHECKIN' }),
      })
    );
  });

  test('throws InvalidStateError khi seat đang trống', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue({
      id: SEAT_ID,
      license: baseLicense,
      assignedUser: null,
      assignedAsset: null,
    });

    await expect(
      checkinLicenseSeat(tx as never, {
        seatId: SEAT_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});

// =====================================================
// expireLicenseSeat
// =====================================================

describe('expireLicenseSeat', () => {
  test('happy path: đánh dấu expired seat', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue({
      id: SEAT_ID,
      license: baseLicense,
      unreassignableSeat: false,
      assignedUser: null,
    });
    tx.licenseSeat.update.mockResolvedValue({
      id: SEAT_ID,
      unreassignableSeat: true,
    });

    await expireLicenseSeat(tx as never, {
      seatId: SEAT_ID,
      actorId: ADMIN_ID,
      reason: 'License bị thu hồi từ Microsoft',
    });

    expect(tx.licenseSeat.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unreassignableSeat: true,
        }),
      })
    );
    expect(tx.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: 'UPDATE',
          notes: expect.stringContaining('License bị thu hồi'),
        }),
      })
    );
  });

  test('throws InvalidStateError khi seat đã expired trước đó', async () => {
    const tx = makeTxMock();
    tx.licenseSeat.findUnique.mockResolvedValue({
      id: SEAT_ID,
      license: baseLicense,
      unreassignableSeat: true,
      assignedUser: null,
    });

    await expect(
      expireLicenseSeat(tx as never, {
        seatId: SEAT_ID,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});

// =====================================================
// createLicenseWithSeats
// =====================================================

describe('createLicenseWithSeats', () => {
  test('happy path: tạo license + 3 seats', async () => {
    const tx = makeTxMock();
    tx.license.create.mockResolvedValue({
      id: 'new-lic',
      name: 'Adobe',
      seats: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
    });

    await createLicenseWithSeats(tx as never, {
      name: 'Adobe',
      productKey: 'PK-123',
      seatCount: 3,
      actorId: ADMIN_ID,
    });

    expect(tx.license.create).toHaveBeenCalledTimes(1);
    const createArgs = tx.license.create.mock.calls[0][0];
    expect(createArgs.data.name).toBe('Adobe');
    expect(createArgs.data.seats.create).toHaveLength(3);
    expect(tx.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actionType: 'CREATE' }),
      })
    );
  });

  test('tự động clamp seatCount xuống tối thiểu 1 nếu < 1', async () => {
    const tx = makeTxMock();
    tx.license.create.mockResolvedValue({
      id: 'new-lic',
      name: 'X',
      seats: [{ id: 's1' }],
    });

    await createLicenseWithSeats(tx as never, {
      name: 'X',
      seatCount: -5,
      actorId: ADMIN_ID,
    });

    const createArgs = tx.license.create.mock.calls[0][0];
    expect(createArgs.data.seats.create).toHaveLength(1);
  });

  test('throws InvalidStateError khi name rỗng', async () => {
    const tx = makeTxMock();
    await expect(
      createLicenseWithSeats(tx as never, {
        name: '   ',
        seatCount: 1,
        actorId: ADMIN_ID,
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
    // Verify KHÔNG gọi prisma tạo license
    expect(tx.license.create).not.toHaveBeenCalled();
  });
});
