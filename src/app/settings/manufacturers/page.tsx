import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'
import ManufacturersTable from '@/components/settings/ManufacturersTable'
import { Factory } from 'lucide-react'

export default async function ManufacturersPage() {
  try {
    await requireRole('ADMIN')
  } catch {
    redirect('/')
  }

  const manufacturers = await prisma.manufacturer.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <Factory size={24} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nhà sản xuất</h1>
            <p className="text-gray-500 mt-1">Quản lý danh sách nhà sản xuất thiết bị.</p>
          </div>
        </div>
      </div>

      <ManufacturersTable manufacturers={manufacturers} />
    </div>
  )
}
