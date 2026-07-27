/**
 * Categories Settings — F-7: Category CRUD.
 */
import prisma from '@/lib/prisma'
import CategoriesTable from '@/components/settings/CategoriesTable'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}

export default async function CategoriesPage() {
  try { await requirePermission('settings.read') } catch { redirect('/') }
  const categories = await getCategories()

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Danh mục</h1>
          <p className="text-gray-500">Quản lý danh mục tài sản và license.</p>
        </div>
        <Link href="/settings/categories/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
          + Thêm danh mục
        </Link>
      </div>
      <CategoriesTable categories={categories} />
    </div>
  )
}
