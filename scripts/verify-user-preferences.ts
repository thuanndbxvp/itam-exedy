/**
 * scripts/verify-user-preferences.ts
 *
 * Sprint D - verification script: kiểm tra cascade delete + default values.
 *
 * Steps:
 *  1. Tạo 1 user throwaway để test
 *  2. Tạo preference cho user đó
 *  3. Verify preference có default values
 *  4. Xóa user
 *  5. Verify preference cũng bị xóa (cascade)
 *
 * Cleanup: nếu fail ở giữa, vẫn ensure user bị xóa.
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
  const testEmail = `verify-sprint-d-${Date.now()}@throwaway.local`

  // 1. Tạo user throwaway
  const u = await prisma.user.create({
    data: {
      email: testEmail,
      username: testEmail,
      firstName: 'Test',
      lastName: 'SprintD',
      role: 'EMPLOYEE',
      activated: true,
    },
  })
  console.log('[verify] Created user', u.email)

  // 2. Tạo preference (default values từ Prisma schema)
  const pref = await prisma.userPreference.create({
    data: { userId: u.id },
  })
  console.log('[verify] Created preference with defaults:', JSON.stringify(pickPref(pref), null, 2))

  // 3. Verify defaults
  const errors: string[] = []
  if (pref.emailDigestFrequency !== 'DAILY') errors.push(`emailDigestFrequency expected=DAILY, got=${pref.emailDigestFrequency}`)
  if (pref.theme !== 'SYSTEM') errors.push(`theme expected=SYSTEM, got=${pref.theme}`)
  if (!pref.createdAt) errors.push('createdAt missing')
  if (!pref.updatedAt) errors.push('updatedAt missing')

  // 4. Xóa user
  await prisma.user.delete({ where: { id: u.id } })
  console.log('[verify] Deleted user')

  // 5. Verify preference đã bị cascade delete
  const after = await prisma.userPreference.findUnique({ where: { userId: u.id } })
  if (after) {
    errors.push('FAIL: preference NOT cascade deleted!')
    // cleanup
    await prisma.userPreference.delete({ where: { userId: u.id } }).catch(() => {})
  } else {
    console.log('[verify] OK: preference cascade deleted')
  }

  if (errors.length > 0) {
    console.error('[verify] FAIL:')
    errors.forEach((e) => console.error('  -', e))
    process.exit(1)
  }

  console.log('[verify] PASS: all checks OK ✓')
}

function pickPref(p: { emailDigestFrequency: string; theme: string; muteUntil: Date | null; createdAt: Date; updatedAt: Date; locale: string | null }) {
  return {
    emailDigestFrequency: p.emailDigestFrequency,
    theme: p.theme,
    muteUntil: p.muteUntil,
    locale: p.locale,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

main()
  .catch((e) => {
    console.error('[verify] Fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
