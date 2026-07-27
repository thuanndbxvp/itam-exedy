import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import AssetDetailClient from './AssetDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const asset = await prisma.asset.findUnique({
    where: { id, deletedAt: null },
    select: { name: true, assetTag: true },
  })
  if (!asset) return { title: 'Asset Not Found' }
  return { title: `${asset.name} (${asset.assetTag})` }
}

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params

  const asset = await prisma.asset.findUnique({
    where: { id, deletedAt: null },
    include: {
      status: true,
      assignedUser: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignedLocation: { select: { id: true, name: true, address: true } },
      assignedAsset: { select: { id: true, assetTag: true, name: true } },
      rtdLocation: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      manufacturer: { select: { id: true, name: true } },
      model: { select: { id: true, name: true, modelNumber: true } },
      supplier: { select: { id: true, name: true } },
      depreciation: { select: { id: true, name: true, months: true } },
    },
  })

  if (!asset) notFound()

  const [allUsers, allLocations, allStatuses] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, activated: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    }),
    prisma.location.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.statusLabel.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  // Serialize dates
  const serialized = {
    ...asset,
    assignedUserId: asset.assignedUserId,
    assignedLocationId: asset.assignedLocationId,
    assignedAssetId: asset.assignedAssetId,
    purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null,
    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
    assetEolDate: asset.assetEolDate?.toISOString() ?? null,
    lastAuditDate: asset.lastAuditDate?.toISOString() ?? null,
    nextAuditDate: asset.nextAuditDate?.toISOString() ?? null,
    lastCheckout: asset.lastCheckout?.toISOString() ?? null,
    lastCheckin: asset.lastCheckin?.toISOString() ?? null,
    expectedCheckin: asset.expectedCheckin?.toISOString() ?? null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    deletedAt: asset.deletedAt?.toISOString() ?? null,
  }

  return (
    <AssetDetailClient
      asset={serialized}
      users={allUsers}
      locations={allLocations}
      statuses={allStatuses}
    />
  )
}
