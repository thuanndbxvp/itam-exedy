import prisma from '@/lib/prisma'
import NewUserForm from './NewUserForm'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/permissions/guard'

async function getDepartments() {
  return prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      company: { select: { id: true, name: true } },
    },
  })
}

async function getCustomRoles() {
  return prisma.roleDefinition.findMany({
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true, baseRole: true },
  })
}

async function getCompanies() {
  return prisma.company.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

async function getLocations() {
  return prisma.location.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

async function getManagers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true },
    take: 200,
  })
}

export default async function Page() {
  try {
    await requirePermission('users.create')
  } catch {
    redirect('/')
  }
  const [departments, customRoles, companies, locations, managers] = await Promise.all([
    getDepartments(),
    getCustomRoles(),
    getCompanies(),
    getLocations(),
    getManagers(),
  ])
  return (
    <NewUserForm
      departments={departments}
      customRoles={customRoles}
      companies={companies}
      locations={locations}
      managers={managers}
    />
  )
}