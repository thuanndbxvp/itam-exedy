import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('--- Migrating Status Labels ---')

  const newStatuses = [
    { name: 'Sẵn sàng', deployable: true, pending: false, archived: false, color: '#10b981', showInNav: false },
    { name: 'Đang sử dụng', deployable: false, pending: false, archived: false, color: '#3b82f6', showInNav: true },
    { name: 'Đang chờ xử lý', deployable: false, pending: true, archived: false, color: '#f59e0b', showInNav: false },
    { name: 'Đang sửa chữa', deployable: false, pending: false, archived: false, color: '#ef4444', showInNav: false },
    { name: 'Đã thanh lý / Hủy', deployable: false, pending: false, archived: true, color: '#6b7280', showInNav: false },
  ]

  // 1. Ensure new statuses exist
  const statusMap = new Map<string, string>()
  for (const s of newStatuses) {
    const created = await prisma.statusLabel.upsert({
      where: { name: s.name },
      update: s,
      create: s,
    })
    statusMap.set(s.name, created.id)
  }

  // 2. Map old to new
  const mappings: Record<string, string> = {
    'Ready to Deploy': 'Sẵn sàng',
    'Deployed': 'Đang sử dụng',
    'Pending': 'Đang chờ xử lý',
    'Out for Diagnostics': 'Đang sửa chữa',
    'Out for Repair': 'Đang sửa chữa',
    'Broken - Not Fixable': 'Đã thanh lý / Hủy',
    'Archived': 'Đã thanh lý / Hủy',
  }

  // 3. Update assets
  const oldStatuses = await prisma.statusLabel.findMany({
    where: { name: { in: Object.keys(mappings) } },
  })

  for (const old of oldStatuses) {
    const targetName = mappings[old.name]
    const targetId = statusMap.get(targetName)
    if (!targetId) continue

    const result = await prisma.asset.updateMany({
      where: { statusId: old.id },
      data: { statusId: targetId },
    })
    
    if (result.count > 0) {
      console.log(`Moved ${result.count} assets from '${old.name}' to '${targetName}'`)
    }

    // After moving, delete the old status if it's not the same name
    if (old.name !== targetName) {
      await prisma.statusLabel.delete({ where: { id: old.id } })
      console.log(`Deleted old status: ${old.name}`)
    }
  }

  console.log('--- Migration Completed ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
