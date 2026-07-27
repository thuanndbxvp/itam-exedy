import { createAsset } from '@/app/actions/asset'
import { findActionLogs, type SeedIds } from '../setup/pglite-setup'
import { resetAndSeed } from './_helpers'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: jest.Mock }

function useSession(userId: string, role: 'ADMIN' | 'EMPLOYEE') {
  getServerSession.mockResolvedValue({ user: { id: userId, role } })
}

describe('createAsset server action', () => {
  let ids: SeedIds

  beforeEach(async () => {
    ids = await resetAndSeed()
  })

  test('ADMIN tạo asset thành công', async () => {
    useSession(ids.adminId, 'ADMIN')
    const result = await createAsset({ assetTag: 'LAP-001', name: 'Laptop Test', statusId: ids.readyStatusId })

    expect(result.ok && result.data.assetTag).toBe('LAP-001')
  })

  test('EMPLOYEE bị chặn với FORBIDDEN', async () => {
    useSession(ids.employeeId, 'EMPLOYEE')
    const result = await createAsset({ assetTag: 'LAP-002', name: 'Blocked', statusId: ids.readyStatusId })

    expect(!result.ok && result.code).toBe('FORBIDDEN')
  })

  test('thiếu assetTag trả VALIDATION', async () => {
    useSession(ids.adminId, 'ADMIN')
    const result = await createAsset({ assetTag: '  ', name: 'Missing tag', statusId: ids.readyStatusId })

    expect(!result.ok && result.code).toBe('VALIDATION')
  })

  test('tạo asset ghi đúng audit log', async () => {
    useSession(ids.adminId, 'ADMIN')
    const result = await createAsset({ assetTag: 'LAP-AUDIT', name: 'Audited', statusId: ids.readyStatusId })
    const logs = await findActionLogs({ itemType: 'ASSET', actionType: 'CREATE' })

    expect(result.ok && logs[0]?.userId).toBe(ids.adminId)
  })
})
