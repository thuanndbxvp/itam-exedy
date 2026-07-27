import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import AssetModelsTable from '@/components/settings/AssetModelsTable'
import { Box } from 'lucide-react'

export default async function AssetModelsPage() {
  try {
    await requirePermission('settings.read')
  } catch {
    redirect('/')
  }

  const [models, categories, manufacturers, depreciations] = await Promise.all([
    prisma.assetModel.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        manufacturer: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { deletedAt: null, categoryType: 'ASSET' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.manufacturer.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.depreciation.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <Box size={24} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Model thiết bị</h1>
            <p className="text-gray-500 mt-1">Quản lý các model thiết bị (Dell XPS 13, ThinkPad X1, v.v.).</p>
          </div>
        </div>
      </div>

      <AssetModelsTable models={models} categories={categories} manufacturers={manufacturers} depreciations={depreciations} />
    </div>
  )
}