/**
 * Settings helper — đọc/ghi singleton Setting record.
 *
 * Tại sao dùng raw query thay vì Prisma thông thường:
 *   - Model có @ignore → Prisma client không generate helper
 *   - Singleton pattern: WHERE id = 'system' LIMIT 1
 *
 * Phase 3: bỏ @ignore + dùng Prisma update() thông thường.
 */
import prisma from '@/lib/prisma'

export interface Setting {
  id: string
  updatedAt: Date
  companyName: string
  companyId: string | null
  currency: string
  timezone: string
  locale: string
  logoUrl: string | null
  primaryColor: string
  fullMultipleCompaniesSupport: boolean
  autoassignAssetsToLocation: boolean
  passwordMinLength: number
  passwordRequireSpecial: boolean
  sessionTimeoutMinutes: number
  twoFactorEnabled: boolean
  emailFrom: string | null
  emailFromName: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  smtpPassword: string | null
  smtpEncryption: string | null
  emailDomain: string | null
  extras: Record<string, unknown>
}

export async function getSettings(): Promise<Setting> {
  // Touch `setting` (lowercase) — Prisma mapped name without @@map.
  const rows = await prisma.$queryRaw<Setting[]>`
    SELECT * FROM "setting" WHERE id = 'system' LIMIT 1
  `
  if (rows[0]) return rows[0]

  // Auto-seed on first access — backstop cho DB mới init.
  await prisma.$executeRawUnsafe(`
    INSERT INTO "setting" (
      "id", "companyName", "currency", "timezone", "locale",
      "primaryColor", "fullMultipleCompaniesSupport",
      "autoassignAssetsToLocation", "passwordMinLength", "passwordRequireSpecial",
      "sessionTimeoutMinutes", "twoFactorEnabled", "updatedAt"
    ) VALUES (
      'system', 'My Company', 'USD', 'UTC', 'en-US',
      '#3b82f6', false,
      false, 8, true,
      60, false, NOW()
    )
    ON CONFLICT ("id") DO NOTHING
  `)

  const recheck = await prisma.$queryRaw<Setting[]>`
    SELECT * FROM "setting" WHERE id = 'system' LIMIT 1
  `
  return recheck[0]!
}

export async function updateSettings(
  data: Partial<Omit<Setting, 'id' | 'updatedAt' | 'extras'>>,
  extras?: Record<string, unknown>
): Promise<void> {
  const entries = Object.entries(data).filter(
    ([k]) => k !== 'id' && k !== 'updatedAt'
  )
  if (entries.length === 0 && !extras) return

  // Build SET clause
  const sets: string[] = []
  for (const [k, v] of entries) {
    if (v === null || v === undefined) {
      sets.push(`"${k}" = NULL`)
    } else if (typeof v === 'string') {
      sets.push(`"${k}" = '${v.replace(/'/g, "''")}'`)
    } else {
      sets.push(`"${k}" = ${JSON.stringify(v)}`)
    }
  }

  if (extras) {
    const current = await prisma.$queryRaw<{ extras: Record<string, unknown> }[]>`
      SELECT extras FROM "setting" WHERE id = 'system'
    `
    const merged = { ...(current[0]?.extras ?? {}), ...extras }
    sets.push(`extras = '${JSON.stringify(merged).replace(/'/g, "''")}'`)
  }

  sets.push(`"updatedAt" = NOW()`)

  await prisma.$executeRawUnsafe(`
    UPDATE "setting" SET ${sets.join(', ')} WHERE id = 'system'
  `)
}
