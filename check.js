const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst({
    where: { email: { contains: 'nguyenha' } },
    include: {
      customRole: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      },
      userPermissions: {
        include: { permission: true }
      }
    }
  });
  console.log(JSON.stringify(u, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
