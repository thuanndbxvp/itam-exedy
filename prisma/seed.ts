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

  // Sprint D: tạo UserPreference mặc định cho admin
  await prisma.userPreference.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      emailDigestFrequency: 'DAILY',
      theme: 'SYSTEM',
    },
  })
  console.log('Admin userPreference ensured')

  // Default status labels
  const statuses = [
    { name: 'Sẵn sàng', deployable: true, pending: false, archived: false, color: '#10b981', showInNav: false },
    { name: 'Đang sử dụng', deployable: false, pending: false, archived: false, color: '#3b82f6', showInNav: true },
    { name: 'Đang chờ xử lý', deployable: false, pending: true, archived: false, color: '#f59e0b', showInNav: false },
    { name: 'Đang sửa chữa', deployable: false, pending: false, archived: false, color: '#ef4444', showInNav: false },
    { name: 'Đã thanh lý / Hủy', deployable: false, pending: false, archived: true, color: '#6b7280', showInNav: false },
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

  // ===== Epic F: Helpdesk seed =====
  // IT staff + IT manager demo users. Mật khẩu mặc định: staff123 / manager123.
  // Dùng email format dễ nhớ để login test trong /login.
  const itStaffHashed = await bcrypt.hash('staff123', 10)
  const itManagerHashed = await bcrypt.hash('manager123', 10)

  const itManager = await prisma.user.upsert({
    where: { email: 'it.manager@congty.com' },
    update: { role: 'IT_MANAGER', activated: true },
    create: {
      email: 'it.manager@congty.com',
      username: 'it.manager',
      firstName: 'Minh',
      lastName: 'Quản Lý IT',
      password: itManagerHashed,
      role: 'IT_MANAGER',
      activated: true,
    },
  })
  console.log('IT Manager created:', itManager.email)

  const itStaff1 = await prisma.user.upsert({
    where: { email: 'it.staff1@congty.com' },
    update: { role: 'IT_STAFF', activated: true },
    create: {
      email: 'it.staff1@congty.com',
      username: 'it.staff1',
      firstName: 'Tuấn',
      lastName: 'Helpdesk L1',
      password: itStaffHashed,
      role: 'IT_STAFF',
      activated: true,
    },
  })
  console.log('IT Staff 1 created:', itStaff1.email)

  const itStaff2 = await prisma.user.upsert({
    where: { email: 'it.staff2@congty.com' },
    update: { role: 'IT_STAFF', activated: true },
    create: {
      email: 'it.staff2@congty.com',
      username: 'it.staff2',
      firstName: 'Linh',
      lastName: 'Network Admin',
      password: itStaffHashed,
      role: 'IT_STAFF',
      activated: true,
    },
  })
  console.log('IT Staff 2 created:', itStaff2.email)

  // 2 teams cho helpdesk
  const helpdeskTeam = await prisma.team.upsert({
    where: { slug: 'helpdesk-l1' },
    update: { leadId: itManager.id, isActive: true },
    create: {
      name: 'Helpdesk L1',
      slug: 'helpdesk-l1',
      description: 'Tiếp nhận và xử lý sự cố phần cứng, phần mềm cơ bản',
      category: 'HARDWARE',
      isActive: true,
      leadId: itManager.id,
    },
  })
  console.log('Team created:', helpdeskTeam.name)

  const networkTeam = await prisma.team.upsert({
    where: { slug: 'network' },
    update: { leadId: itManager.id, isActive: true },
    create: {
      name: 'Network Team',
      slug: 'network',
      description: 'Xử lý sự cố mạng LAN/WAN, Wi-Fi, VPN',
      category: 'NETWORK',
      isActive: true,
      leadId: itManager.id,
    },
  })
  console.log('Team created:', networkTeam.name)

  // Membership
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: helpdeskTeam.id, userId: itStaff1.id } },
    update: {},
    create: { teamId: helpdeskTeam.id, userId: itStaff1.id, isLead: false },
  })
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: networkTeam.id, userId: itStaff2.id } },
    update: {},
    create: { teamId: networkTeam.id, userId: itStaff2.id, isLead: false },
  })
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: helpdeskTeam.id, userId: itManager.id } },
    update: {},
    create: { teamId: helpdeskTeam.id, userId: itManager.id, isLead: true },
  })
  console.log('Team members seeded')

  // Sample assignment rules (Epic F: auto-assign theo category)
  await prisma.helpdeskAssignmentRule.upsert({
    where: { id: 'rule-hardware-default' },
    update: {},
    create: {
      id: 'rule-hardware-default',
      name: 'HARDWARE → Helpdesk L1',
      category: 'HARDWARE',
      teamId: helpdeskTeam.id,
      weight: 100,
      isActive: true,
      notes: 'Mọi ticket phần cứng tự động vào Helpdesk L1',
    },
  })
  await prisma.helpdeskAssignmentRule.upsert({
    where: { id: 'rule-software-default' },
    update: {},
    create: {
      id: 'rule-software-default',
      name: 'SOFTWARE → Helpdesk L1',
      category: 'SOFTWARE',
      teamId: helpdeskTeam.id,
      weight: 100,
      isActive: true,
      notes: 'Mọi ticket phần mềm tự động vào Helpdesk L1',
    },
  })
  await prisma.helpdeskAssignmentRule.upsert({
    where: { id: 'rule-network-default' },
    update: {},
    create: {
      id: 'rule-network-default',
      name: 'NETWORK → Network Team',
      category: 'NETWORK',
      teamId: networkTeam.id,
      weight: 100,
      isActive: true,
      notes: 'Sự cố mạng → Network Team',
    },
  })
  await prisma.helpdeskAssignmentRule.upsert({
    where: { id: 'rule-account-default' },
    update: {},
    create: {
      id: 'rule-account-default',
      name: 'ACCOUNT → Helpdesk L1',
      category: 'ACCOUNT',
      teamId: helpdeskTeam.id,
      weight: 100,
      isActive: true,
      notes: 'Vấn đề tài khoản (quên mật khẩu, SSO…) → Helpdesk L1',
    },
  })
  await prisma.helpdeskAssignmentRule.upsert({
    where: { id: 'rule-other-default' },
    update: {},
    create: {
      id: 'rule-other-default',
      name: 'OTHER → Helpdesk L1',
      category: 'OTHER',
      teamId: helpdeskTeam.id,
      weight: 100,
      isActive: true,
      notes: 'Vấn đề chưa phân loại → Helpdesk L1 phân loại lại',
    },
  })
  console.log('Helpdesk assignment rules seeded (5)')

  // ===== Epic G: RBAC — seed permissions + system role mappings =====
  const { PERMISSIONS, SYSTEM_ROLE_PERMISSIONS } = await import('../src/lib/permissions/catalog')

  // 1. Permission catalog
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {
        label: p.label,
        description: p.description ?? null,
        resource: p.resource,
        action: p.action,
        group: p.group,
      },
      create: {
        key: p.key,
        label: p.label,
        description: p.description ?? null,
        resource: p.resource,
        action: p.action,
        group: p.group,
      },
    })
  }
  console.log('Seeded', PERMISSIONS.length, 'permissions')

  // 2. System role definitions + mapping permissions
  const systemRoles = [
    { slug: 'system-admin',       name: 'System Admin',      baseRole: 'ADMIN',      color: '#dc2626', description: 'Toàn quyền hệ thống' },
    { slug: 'system-it-manager',  name: 'IT Manager',        baseRole: 'IT_MANAGER', color: '#2563eb', description: 'Quản lý IT, full assets/helpdesk/licenses' },
    { slug: 'system-it-staff',    name: 'IT Staff',          baseRole: 'IT_STAFF',   color: '#0891b2', description: 'Helpdesk + checkout/checkin' },
    { slug: 'system-employee',    name: 'Employee',          baseRole: 'EMPLOYEE',   color: '#6b7280', description: 'Tạo ticket helpdesk, xem asset/license của mình' },
  ]

  for (const r of systemRoles) {
    const def = await prisma.roleDefinition.upsert({
      where: { slug: r.slug },
      update: { name: r.name, baseRole: r.baseRole as 'ADMIN' | 'IT_MANAGER' | 'IT_STAFF' | 'EMPLOYEE', color: r.color, description: r.description, isSystem: true },
      create: { slug: r.slug, name: r.name, baseRole: r.baseRole as 'ADMIN' | 'IT_MANAGER' | 'IT_STAFF' | 'EMPLOYEE', color: r.color, description: r.description, isSystem: true },
    })

    // Replace mapping for this system role
    await prisma.rolePermission.deleteMany({ where: { roleId: def.id } })
    const permKeys = SYSTEM_ROLE_PERMISSIONS[r.baseRole] ?? []
    for (const key of permKeys) {
      const perm = await prisma.permission.findUnique({ where: { key } })
      if (!perm) continue
      await prisma.rolePermission.create({
        data: { roleId: def.id, permissionId: perm.id },
      })
    }
  }
  console.log('Seeded', systemRoles.length, 'system role definitions with permission mappings')
}
main().finally(() => prisma.$disconnect())