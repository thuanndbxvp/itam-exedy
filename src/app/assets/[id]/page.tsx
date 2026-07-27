import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

  // F5 fix (security audit): EMPLOYEE chỉ xem được asset của chính mình.
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) notFound()
  const isPrivileged =
    session.user.role === 'ADMIN' ||
    session.user.role === 'IT_MANAGER' ||
    session.user.role === 'IT_STAFF'

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
      licenseSeats: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: {
          license: {
            select: {
              id: true,
              name: true,
              productKey: true,
              expirationDate: true,
            },
          },
        },
      },
    },
  })

  if (!asset) notFound()

  // F5 enforcement: EMPLOYEE không phải chủ sở hữu → 404 (giấu tồn tại).
  if (!isPrivileged && asset.assignedUserId !== session.user.id) {
    notFound()
  }

  // F5 fix phụ: chỉ load users/locations cho phần edit khi user có quyền.
  // EMPLOYEE chỉ xem, không edit.
  const isAdmin = session.user.role === 'ADMIN'
  const [allUsers, allLocations, allStatuses, transferableAssets] = isAdmin
    ? await Promise.all([
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
        // B7: list asset khả thi để gán (loại trừ chính asset hiện tại)
        prisma.asset.findMany({
          where: {
            deletedAt: null,
            id: { not: id },
            assignedUserId: null,
            assignedLocationId: null,
            assignedAssetId: null,
            status: { deployable: true, pending: false, archived: false },
          },
          orderBy: { assetTag: 'asc' },
          take: 200,
          select: { id: true, assetTag: true, name: true },
        }),
      ])
    : [[], [], [], []]

  // Serialize dates + licenseSeats
  const serializedSeats = (asset.licenseSeats ?? []).map((s) => ({
    id: s.id,
    licenseId: s.licenseId,
    notes: s.notes,
    seatLabel: s.id.slice(-6),
    license: {
      id: s.license.id,
      name: s.license.name,
      productKey: s.license.productKey,
      expirationDate: s.license.expirationDate?.toISOString() ?? null,
    },
    createdAt: s.createdAt.toISOString(),
  }))

  const serialized = {
    ...asset,
    licenseSeats: serializedSeats,
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
      transferableAssets={transferableAssets}
    />
  )
}
