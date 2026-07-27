import { getPg, getPrisma, resetDb, seedMinimal, teardownDb } from '../setup/pglite-setup'

afterAll(async () => {
  await teardownDb()
})

describe('PGlite raw SQL test setup', () => {
  beforeEach(async () => {
    await resetDb()
  })

  test('khởi tạo PostgreSQL in-memory và facade Prisma-compatible', async () => {
    const pg = await getPg()
    const result = await pg.query<{ value: number }>('SELECT 1::int AS value')

    expect(result.rows[0]?.value).toBe(1)
  })

  test('resetDb và seedMinimal tạo đúng dữ liệu tối thiểu', async () => {
    const prisma = await getPrisma()
    await seedMinimal()

    expect(await prisma.user.count()).toBe(3)
  })
})
