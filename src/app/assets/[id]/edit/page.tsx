import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import AssetForm from '../../AssetForm'

interface PageProps { params: Promise<{ id: string }> }

export default async function EditAssetPage({ params }: PageProps) {
  const { id } = await params

  const asset = await prisma.asset.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      assetTag: true,
      name: true,
      serial: true,
      modelId: true,
      categoryId: true,
      manufacturerId: true,
      supplierId: true,
      statusId: true,
      image: true,
      purchaseDate: true,
      purchaseCost: true,
      orderNumber: true,
      warrantyMonths: true,
      rtdLocationId: true,
      depreciationId: true,
      requestable: true,
      byod: true,
      notes: true,
    },
  })

  if (!asset) notFound()

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

  const serialized = {
    ...asset,
    purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null,
    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
  }

  return (
    <AssetForm
      asset={serialized}
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