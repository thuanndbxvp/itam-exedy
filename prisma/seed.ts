import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashed = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@congty.com' },
    update: {},
    create: {
      email: 'admin@congty.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      password: hashed,
      role: 'ADMIN',
      activated: true,
    },
  })
  console.log('Admin user created:', admin.email)

  // Default status labels
  const statuses = [
    { name: 'Ready to Deploy', deployable: true, pending: false, archived: false, color: '#10b981' },
    { name: 'Pending', deployable: false, pending: true, archived: false, color: '#f59e0b' },
    { name: 'Broken - Not Fixable', deployable: false, pending: false, archived: true, color: '#6b7280' },
    { name: 'Out for Diagnostics', deployable: false, pending: false, archived: false, color: '#3b82f6' },
    { name: 'Out for Repair', deployable: false, pending: false, archived: false, color: '#3b82f6' },
    { name: 'Archived', deployable: false, pending: false, archived: true, color: '#000000' },
  ]

  for (const s of statuses) {
    await prisma.statusLabel.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    })
  }
  console.log('Seeded', statuses.length, 'status labels')

  // Default categories
  const categories = ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Printer', 'Network Device', 'License', 'Other']
  for (const name of categories) {
    await prisma.category.upsert({
      where: { id: name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        categoryType: ['License'].includes(name) ? 'LICENSE' : 'ASSET',
      },
    })
  }
  console.log('Seeded', categories.length, 'categories')
}
main().finally(() => prisma.$disconnect())