/**
 * Depreciation Settings — F-8 / A5: CRUD Depreciation rules.
 */
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import { TrendingDown } from 'lucide-react'
import DepreciationTable from '@/components/settings/DepreciationTable'

export default async function DepreciationPage() {
  let canWrite = false
  try {
    await requirePermission('settings.read')
    canWrite = true
  } catch {
    redirect('/')
  }

  const depreciations = await prisma.depreciation.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  })

  // Serialize Decimal → string cho Client Component
  const items = depreciations.map((d) => ({
    id: d.id,
    name: d.name,
    months: d.months,
    depreciationType: d.depreciationType,
    minimumValue: d.minimumValue.toString(),
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }))

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <TrendingDown size={22} className="text-gray-400" />
          Khấu hao
        </h1>
        <p className="text-gray-500">Quản lý quy tắc khấu hao tài sản.</p>
      </div>
      <DepreciationTable initial={items} canEdit={canWrite} />
    </div>
  )
}