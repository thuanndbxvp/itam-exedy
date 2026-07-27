import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import AssetForm from '../AssetForm'

export default async function NewAssetPage() {
  const [statuses, categories, models, manufacturers, suppliers, locations, depreciations] = await Promise.all([
    prisma.statusLabel.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.assetModel.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.manufacturer.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.location.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.depreciation.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  if (!statuses.length) {
    redirect('/settings/statuses')
  }

  return (
    <AssetForm
      statuses={statuses}
      categories={categories}
      models={models}
      manufacturers={manufacturers}
      suppliers={suppliers}
      locations={locations}
      depreciations={depreciations}
    />
  )
}