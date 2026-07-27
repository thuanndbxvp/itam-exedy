import { checkinAssetCmd, checkoutAssetCmd, checkoutAssetToLocationCmd } from '@/app/actions/asset'
import { findLocationById, getPrisma, type SeedIds, type TestAsset } from '../setup/pglite-setup'
import { resetAndSeed } from './_helpers'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: jest.Mock }

function useSession(userId: string, role: 'ADMIN' | 'EMPLOYEE') {
  getServerSession.mockResolvedValue({ user: { id: userId, role } })
}

describe('asset checkout server actions', () => {
  let ids: SeedIds

  beforeEach(async () => {
    ids = await resetAndSeed()
  })

  async function createAsset(assetTag: string): Promise<TestAsset> {
    const prisma = await getPrisma()
    return (await prisma.asset.create({ data: { assetTag, name: assetTag, statusId: ids.readyStatusId } })) as TestAsset
  }

  test('ADMIN checkout asset cho user thành công', async () => {
    useSession(ids.adminId, 'ADMIN')
    const asset = await createAsset('CHECKOUT-001')
    const result = await checkoutAssetCmd({ assetId: asset.id, targetUserId: ids.employeeId })

    expect(result.ok).toBe(true)
  })

  test('EMPLOYEE checkout bị chặn với FORBIDDEN', async () => {
    useSession(ids.employeeId, 'EMPLOYEE')
    const asset = await createAsset('CHECKOUT-002')
    const result = await checkoutAssetCmd({ assetId: asset.id, targetUserId: ids.employeeId })

    expect(!result.ok && result.code).toBe('FORBIDDEN')
  })

  test('ADMIN checkin asset đã cấp phát thành công', async () => {
    useSession(ids.adminId, 'ADMIN')
    const asset = await createAsset('CHECKIN-001')
    await checkoutAssetCmd({ assetId: asset.id, targetUserId: ids.employeeId })
    const result = await checkinAssetCmd({ assetId: asset.id })

    expect(result.ok).toBe(true)
  })

  test('ADMIN checkout asset cho location thành công', async () => {
    useSession(ids.adminId, 'ADMIN')
    const asset = await createAsset('LOCATION-001')
    const prisma = await getPrisma()
    const created = (await prisma.location.create({ data: { name: 'Kho Hà Nội', companyId: ids.companyId } })) as { id: string }
    const location = await findLocationById(created.id)
    const result = await checkoutAssetToLocationCmd({ assetId: asset.id, targetLocationId: location?.id ?? '' })

    expect(result.ok).toBe(true)
  })
})
