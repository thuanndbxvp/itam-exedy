import { _resetLocksForTesting } from '@/lib/locking'
import { resetDb, seedMinimal, teardownDb, type SeedIds } from '../setup/pglite-setup'

afterAll(async () => {
  await teardownDb()
})

export async function resetAndSeed(): Promise<SeedIds> {
  _resetLocksForTesting()
  await resetDb()
  return seedMinimal()
}
