import 'dotenv/config'
import prisma from './src/lib/prisma'

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'nguyenha' } },
  })
  
  if (!user) {
    console.log('User nguyenha not found')
    return
  }
  
  console.log('Found user:', user.email, 'Role:', user.role)
  
  // 1. Set customRoleId to null
  await prisma.user.update({
    where: { id: user.id },
    data: { customRoleId: null }
  })
  console.log('Set customRoleId to null.')
  
  // 2. Delete UserPermission overrides for assets.read, users.read, licenses.read, settings.update
  const permissions = await prisma.permission.findMany({
    where: { key: { in: ['assets.read', 'licenses.read', 'users.read', 'settings.update'] } }
  })
  
  const permIds = permissions.map(p => p.id)
  
  if (permIds.length > 0) {
    const deleted = await prisma.userPermission.deleteMany({
      where: {
        userId: user.id,
        permissionId: { in: permIds }
      }
    })
    console.log(`Deleted ${deleted.count} UserPermission overrides.`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
