import { checkoutAssetCmd } from '@/app/actions/asset'
import { findActionLogs, findAssetById, getPrisma, type SeedIds, type TestAsset } from '../setup/pglite-setup'
import { resetAndSeed } from './_helpers'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: jest.Mock }

describe('race condition khi checkout cùng asset', () => {
  let ids: SeedIds

  beforeEach(async () => {
    ids = await resetAndSeed()
    getServerSession.mockResolvedValue({ user: { id: ids.adminId, role: 'ADMIN' } })
  })

  test('hai request overlap chỉ có một success và một LOCKED', async () => {
    const prisma = await getPrisma()
    const asset = (await prisma.asset.create({ data: { assetTag: 'RACE-001', name: 'Race Asset', statusId: ids.readyStatusId } })) as TestAsset
    const startedAt = Date.now()
    const results = await Promise.all([
      checkoutAssetCmd({ assetId: asset.id, targetUserId: ids.adminId, notes: 'Request 1' }),
      checkoutAssetCmd({ assetId: asset.id, targetUserId: ids.employeeId, notes: 'Request 2' }),
    ])
    const elapsedMs = Date.now() - startedAt
    const successCount = results.filter((result) => result.ok).length
    const lockedCount = results.filter((result) => !result.ok && result.code === 'LOCKED').length
    const finalAsset = await findAssetById(asset.id)
    const logs = await findActionLogs({ itemId: asset.id, actionType: 'CHECKOUT' })

    expect({ successCount, lockedCount, checkoutCounter: finalAsset?.checkoutCounter, logs: logs.length, overlapped: elapsedMs < 5_000 }).toEqual({ successCount: 1, lockedCount: 1, checkoutCounter: 1, logs: 1, overlapped: true })
  })
})
