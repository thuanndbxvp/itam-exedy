import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting DB wipe (keeping only admin@congty.com and system configs)...')

  // 1. Transactional logs & interactions
  await prisma.ticketComment.deleteMany()
  await prisma.ticketAttachment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.helpdeskNotification.deleteMany()
  await prisma.actionLog.deleteMany()

  // 2. Asset Handovers & Maintenance
  await prisma.assetHandover.deleteMany()
  await prisma.assetMaintenance.deleteMany()

  // 3. Licenses
  await prisma.licenseSeat.deleteMany()
  await prisma.license.deleteMany()

  // 4. Assets
  await prisma.asset.deleteMany()

  // 5. Master Data (Hardware related)
  await prisma.assetModel.deleteMany()
  await prisma.manufacturer.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.department.deleteMany()
  await prisma.location.deleteMany()

  // 6. Helpdesk Teams
  await prisma.teamMember.deleteMany()
  await prisma.helpdeskAssignmentRule.deleteMany()
  await prisma.team.deleteMany()

  // 7. Users
  // Xóa Preferences của những user sẽ bị xóa
  await prisma.userPreference.deleteMany({
    where: {
      user: {
        email: { not: 'admin@congty.com' }
      }
    }
  })
  
  // Xóa tất cả Users ngoại trừ admin@congty.com
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { not: 'admin@congty.com' }
    }
  })

  console.log(`Wiped data successfully. Deleted ${deletedUsers.count} users.`)
  console.log('Retained: admin@congty.com, Status Labels, Categories, Roles, Permissions.')
}

main()
  .catch((e) => {
    console.error('Error during DB wipe:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
