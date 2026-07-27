/**
 * Companies Settings — F-4: Company CRUD.
 */
import prisma from '@/lib/prisma'
import CompaniesTable from '@/components/settings/CompaniesTable'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getCompanies() { return prisma.company.findMany({ orderBy: { name: 'asc' } }) }

export default async function CompaniesPage() {
  try { await requirePermission('settings.read') } catch { redirect('/') }
  const companies = await getCompanies()
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Công ty</h1>
          <p className="text-gray-500">Quản lý công ty trong hệ thống.</p>
        </div>
        <Link href="/settings/companies/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">+ Thêm công ty</Link>
      </div>
      <CompaniesTable companies={companies} />
    </div>
  )
}
