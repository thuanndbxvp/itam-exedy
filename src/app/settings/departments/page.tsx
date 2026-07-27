/**
 * Departments Settings — Quản lý phòng ban trong hệ thống.
 */
import prisma from '@/lib/prisma'
import DepartmentsTable from '@/components/settings/DepartmentsTable'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'

async function getDepartments() {
  const deps = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      _count: { select: { users: true } },
    },
  })
  // Department schema KHONG co relation `location`, nhung co locationId.
  // Resolve location names manually de hien thi ten vi tri o UI.
  const locIds = deps
    .map((d) => d.locationId)
    .filter((v): v is string => !!v)
  const locs = locIds.length
    ? await prisma.location.findMany({
        where: { id: { in: locIds } },
        select: { id: true, name: true },
      })
    : []
  const map = new Map(locs.map((l) => [l.id, l]))
  return deps.map((d) => ({ ...d, location: d.locationId ? (map.get(d.locationId) ?? null) : null }))
}

async function getCompanies() {
  return prisma.company.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
}

async function getPotentialManagers() {
  return prisma.user.findMany({
    where: { activated: true, deletedAt: null },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true },
  })
}

async function getLocations() {
  return prisma.location.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

export default async function DepartmentsPage() {
  try {
    await requirePermission('settings.read')
  } catch {
    redirect('/')
  }

  const [departments, companies, managers, locations] = await Promise.all([
    getDepartments(),
    getCompanies(),
    getPotentialManagers(),
    getLocations(),
  ])

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Phòng ban</h1>
          <p className="text-gray-500">Quản lý các phòng ban, công ty và trưởng phòng trong hệ thống.</p>
        </div>
      </div>
      <DepartmentsTable
        departments={departments}
        companies={companies}
        managers={managers}
        locations={locations}
      />
    </div>
  )
}
