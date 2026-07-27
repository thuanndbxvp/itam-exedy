/**
 * scripts/migrate-user-preferences.ts
 *
 * Sprint D: chèn UserPreference mặc định cho User chưa có.
 * Idempotent: chạy nhiều lần không sao (dùng `none: { userId }` trong skip).
 *
 * Usage: npx tsx scripts/migrate-user-preferences.ts
 */
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Tìm tất cả user CHƯA có preference
  const usersWithoutPref = await prisma.user.findMany({
    where: { preference: null },
    select: { id: true, email: true, firstName: true },
  })

  if (usersWithoutPref.length === 0) {
    console.log('[migrate-user-preferences] All users already have preferences. Nothing to do.')
    return
  }

  console.log(`[migrate-user-preferences] Found ${usersWithoutPref.length} user(s) without preference.`)

  let created = 0
  for (const u of usersWithoutPref) {
    try {
      await prisma.userPreference.create({
        data: {
          userId: u.id,
          emailDigestFrequency: 'DAILY',
          theme: 'SYSTEM',
        },
      })
      created++
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[migrate-user-preferences] Failed for user ${u.email} (${u.id}): ${msg}`)
    }
  }

  console.log(`[migrate-user-preferences] Created ${created}/${usersWithoutPref.length} preferences.`)
}

main()
  .catch((e) => {
    console.error('[migrate-user-preferences] Fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
