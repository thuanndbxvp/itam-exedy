/**
 * Departments Settings — Quản lý phòng ban trong hệ thống.
 */
import prisma from '@/lib/prisma'
import DepartmentsTable from '@/components/settings/DepartmentsTable'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'

async function getDepartments() {
  return prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      _count: { select: { users: true } },
    },
  })
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

export default async function DepartmentsPage() {
  try {
    await requirePermission('settings.read')
  } catch {
    redirect('/')
  }

  const [departments, companies, managers] = await Promise.all([
    getDepartments(),
    getCompanies(),
    getPotentialManagers(),
  ])

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Phòng ban</h1>
          <p className="text-gray-500">Quản lý các phòng ban, công ty và trưởng phòng trong hệ thống.</p>
        </div>
      </div>
      <DepartmentsTable departments={departments} companies={companies} managers={managers} />
    </div>
  )
}
