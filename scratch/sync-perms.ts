import prisma from '../src/lib/prisma'
import { PERMISSIONS } from '../src/lib/permissions/catalog'

async function main() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {
        resource: p.resource,
        action: p.action,
        label: p.label,
        description: p.description ?? null,
        group: p.group,
      },
      create: {
        key: p.key,
        resource: p.resource,
        action: p.action,
        label: p.label,
        description: p.description ?? null,
        group: p.group,
      },
    })
  }
  console.log('Synced', PERMISSIONS.length, 'permissions')
}

main().catch(console.error).finally(() => prisma.$disconnect())
