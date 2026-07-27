import prisma from '@/lib/prisma'
import EditUserForm from './EditUserForm'
import { notFound } from 'next/navigation'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [user, departments, customRoles, companies, locations, managers] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { department: true } }),
    prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, company: { select: { id: true, name: true } } },
    }),
    prisma.roleDefinition.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, baseRole: true },
    }),
    prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.location.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    // Loại trừ chính user hiện tại để tránh tự quản lý mình
    prisma.user.findMany({
      where: { deletedAt: null, id: { not: id } },
      orderBy: { firstName: 'asc' },
      select: { id: true, firstName: true, lastName: true },
      take: 200,
    }),
  ])
  if (!user) notFound()
  return (
    <EditUserForm
      user={user}
      departments={departments}
      customRoles={customRoles}
      companies={companies}
      locations={locations}
      managers={managers}
    />
  )
}