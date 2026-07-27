import { checkinLicenseSeatCmd, checkoutLicenseSeatCmd, expireLicenseSeatCmd } from '@/app/actions/license'
import { findSeatById, getPrisma, type SeedIds, type TestLicense, type TestLicenseSeat } from '../setup/pglite-setup'
import { resetAndSeed } from './_helpers'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: jest.Mock }

describe('license seat server actions', () => {
  let ids: SeedIds

  beforeEach(async () => {
    ids = await resetAndSeed()
    getServerSession.mockResolvedValue({ user: { id: ids.adminId, role: 'ADMIN' } })
  })

  async function createSeat(): Promise<TestLicenseSeat> {
    const prisma = await getPrisma()
    const license = (await prisma.license.create({ data: { name: 'Test License', seats: { create: [{ notes: 'Seat' }] } } })) as TestLicense
    const seat = license.seats?.[0]
    if (!seat) throw new Error('Seat creation failed')
    return seat
  }

  test('checkout seat cho user thành công', async () => {
    const seat = await createSeat()
    const result = await checkoutLicenseSeatCmd({ seatId: seat.id, targetUserId: ids.employeeId })

    expect(result.ok).toBe(true)
  })

  test('checkin seat đã cấp phát thành công', async () => {
    const seat = await createSeat()
    await checkoutLicenseSeatCmd({ seatId: seat.id, targetUserId: ids.employeeId })
    const result = await checkinLicenseSeatCmd({ seatId: seat.id })

    expect(result.ok).toBe(true)
  })

  test('expire seat đánh dấu unreassignable', async () => {
    const seat = await createSeat()
    const result = await expireLicenseSeatCmd({ seatId: seat.id, reason: 'Supplier revoked' })
    const updated = await findSeatById(seat.id)

    expect(result.ok && updated?.unreassignableSeat).toBe(true)
  })

  test('EMPLOYEE checkout seat bị chặn với FORBIDDEN', async () => {
    const seat = await createSeat()
    getServerSession.mockResolvedValue({ user: { id: ids.employeeId, role: 'EMPLOYEE' } })
    const result = await checkoutLicenseSeatCmd({ seatId: seat.id, targetUserId: ids.employeeId })

    expect(!result.ok && result.code).toBe('FORBIDDEN')
  })
})
