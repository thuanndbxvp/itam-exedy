import { getActorUserId } from '@/lib/audit'
import { type SeedIds } from '../setup/pglite-setup'
import { resetAndSeed } from './_helpers'

describe('getActorUserId', () => {
  let ids: SeedIds

  beforeEach(async () => {
    ids = await resetAndSeed()
  })

  test('trả session user khi có user id', async () => {
    await expect(getActorUserId(ids.adminId)).resolves.toBe(ids.adminId)
  })

  test('trả system user khi không có session user', async () => {
    await expect(getActorUserId(null)).resolves.toBe(ids.systemUserId)
  })
})
