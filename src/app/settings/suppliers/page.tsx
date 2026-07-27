import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import SuppliersTable from '@/components/settings/SuppliersTable'
import { Package } from 'lucide-react'

export default async function SuppliersPage() {
  try {
    await requirePermission('settings.read')
  } catch {
    redirect('/')
  }

  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <Package size={24} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nhà cung cấp</h1>
            <p className="text-gray-500 mt-1">Quản lý danh sách nhà cung cấp thiết bị & dịch vụ.</p>
          </div>
        </div>
      </div>

      <SuppliersTable suppliers={suppliers} />
    </div>
  )
}
