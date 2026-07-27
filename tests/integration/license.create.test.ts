import { createLicense } from '@/app/actions/license'
import { getPrisma, type SeedIds } from '../setup/pglite-setup'
import { resetAndSeed } from './_helpers'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: jest.Mock }

function useSession(userId: string, role: 'ADMIN' | 'EMPLOYEE') {
  getServerSession.mockResolvedValue({ user: { id: userId, role } })
}

describe('createLicense server action', () => {
  let ids: SeedIds

  beforeEach(async () => {
    ids = await resetAndSeed()
  })

  test('ADMIN tạo license cùng seats thành công', async () => {
    useSession(ids.adminId, 'ADMIN')
    const result = await createLicense({ name: 'Microsoft 365', productKey: 'KEY-001', seatsTotal: 3 })

    expect(result.ok && result.data.seatsCount).toBe(3)
  })

  test('EMPLOYEE tạo license bị chặn với FORBIDDEN', async () => {
    useSession(ids.employeeId, 'EMPLOYEE')
    const result = await createLicense({ name: 'Blocked', seatsTotal: 1 })

    expect(!result.ok && result.code).toBe('FORBIDDEN')
  })

  test('tạo license ghi audit log CREATE', async () => {
    useSession(ids.adminId, 'ADMIN')
    const prisma = await getPrisma()
    await createLicense({ name: 'Audited License', seatsTotal: 2 })
    const logs = await prisma.actionLog.findMany({ where: { itemType: 'LICENSE', actionType: 'CREATE' } })

    expect(logs).toHaveLength(1)
  })
})
