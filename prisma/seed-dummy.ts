import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding dummy data...')

  // 1. Users (Employees)
  const hashed = await bcrypt.hash('password123', 10)
  const emp1 = await prisma.user.upsert({
    where: { email: 'nv.a@congty.com' },
    update: {},
    create: {
      email: 'nv.a@congty.com',
      username: 'nva',
      firstName: 'Nguyễn Văn',
      lastName: 'A',
      password: hashed,
      role: 'EMPLOYEE',
      activated: true,
      jobTitle: 'Developer',
    },
  })
  const emp2 = await prisma.user.upsert({
    where: { email: 'nv.b@congty.com' },
    update: {},
    create: {
      email: 'nv.b@congty.com',
      username: 'nvb',
      firstName: 'Trần Thị',
      lastName: 'B',
      password: hashed,
      role: 'EMPLOYEE',
      activated: true,
      jobTitle: 'Designer',
    },
  })
  console.log('Dummy employees created.')

  // 2. Manufacturers
  const apple = await prisma.manufacturer.upsert({
    where: { name: 'Apple' },
    update: {},
    create: { name: 'Apple', supportUrl: 'https://support.apple.com' },
  })
  const lenovo = await prisma.manufacturer.upsert({
    where: { name: 'Lenovo' },
    update: {},
    create: { name: 'Lenovo', supportUrl: 'https://support.lenovo.com' },
  })
  const microsoft = await prisma.manufacturer.upsert({
    where: { name: 'Microsoft' },
    update: {},
    create: { name: 'Microsoft', supportUrl: 'https://support.microsoft.com' },
  })
  console.log('Manufacturers created.')

  // 3. Suppliers
  const phongvu = await prisma.supplier.upsert({
    where: { id: 'supp-phongvu' },
    update: {},
    create: { id: 'supp-phongvu', name: 'Phong Vũ', contact: '0901234567', address: 'HCM' },
  })
  const fpt = await prisma.supplier.upsert({
    where: { id: 'supp-fpt' },
    update: {},
    create: { id: 'supp-fpt', name: 'FPT Shop', contact: '18006601', address: 'Hà Nội' },
  })
  console.log('Suppliers created.')

  // 4. Asset Models
  const macbookModel = await prisma.assetModel.upsert({
    where: { name_manufacturerId: { name: 'MacBook Pro 14 M3', manufacturerId: apple.id } },
    update: {},
    create: {
      name: 'MacBook Pro 14 M3',
      categoryId: 'laptop',
      manufacturerId: apple.id,
      modelNumber: 'MRX33',
    },
  })
  const thinkpadModel = await prisma.assetModel.upsert({
    where: { name_manufacturerId: { name: 'ThinkPad T14 Gen 4', manufacturerId: lenovo.id } },
    update: {},
    create: {
      name: 'ThinkPad T14 Gen 4',
      categoryId: 'laptop',
      manufacturerId: lenovo.id,
      modelNumber: '21HD0011VN',
    },
  })
  console.log('Asset Models created.')

  // 5. Assets
  const statusReady = await prisma.statusLabel.findUnique({ where: { name: 'Sẵn sàng' } })
  const statusDeployed = await prisma.statusLabel.findUnique({ where: { name: 'Đang sử dụng' } })

  if (statusReady && statusDeployed) {
    await prisma.asset.upsert({
      where: { assetTag: 'AST-0001' },
      update: {},
      create: {
        assetTag: 'AST-0001',
        name: 'MacBook Pro của NV A',
        serial: 'C02XXXXX1',
        modelId: macbookModel.id,
        categoryId: 'laptop',
        manufacturerId: apple.id,
        statusId: statusDeployed.id,
        assignedUserId: emp1.id,
        supplierId: phongvu.id,
        purchaseCost: 45000000,
        purchaseDate: new Date('2025-01-15'),
      },
    })
    await prisma.asset.upsert({
      where: { assetTag: 'AST-0002' },
      update: {},
      create: {
        assetTag: 'AST-0002',
        name: 'ThinkPad T14 Spare',
        serial: 'PFXXXXX2',
        modelId: thinkpadModel.id,
        categoryId: 'laptop',
        manufacturerId: lenovo.id,
        statusId: statusReady.id,
        supplierId: fpt.id,
        purchaseCost: 28000000,
        purchaseDate: new Date('2025-02-10'),
      },
    })
  }
  console.log('Assets created.')

  // 6. Licenses
  const o365 = await prisma.license.upsert({
    where: { id: 'lic-o365' },
    update: {},
    create: {
      id: 'lic-o365',
      name: 'Office 365 E3',
      manufacturerId: microsoft.id,
      categoryId: 'license',
      supplierId: fpt.id,
      productKey: 'O365-XXXX-YYYY',
      purchaseCost: 5000000,
    },
  })
  
  // Seed seats for license
  const existingSeats = await prisma.licenseSeat.count({ where: { licenseId: o365.id } })
  if (existingSeats === 0) {
    await prisma.licenseSeat.create({
      data: { licenseId: o365.id, assignedUserId: emp1.id },
    })
    await prisma.licenseSeat.create({
      data: { licenseId: o365.id, assignedUserId: emp2.id },
    })
    await prisma.licenseSeat.create({
      data: { licenseId: o365.id },
    }) // 1 empty seat
  }
  console.log('Licenses created.')

  console.log('Seeding dummy data completed successfully!')
}

main().finally(() => prisma.$disconnect())
