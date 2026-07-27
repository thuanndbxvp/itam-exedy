import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LicenseDetailClient from './LicenseDetailClient'

interface LicenseDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * F9 fix (security audit): mask productKey cho mọi role không phải ADMIN.
 * Format: "XXXX-XXXX-XXXX-1234" — chỉ giữ 4 ký tự cuối.
 */
function maskProductKey(key: string | null): string {
  if (!key) return ''
  const cleaned = key.replace(/[^a-zA-Z0-9]/g, '')
  const last4 = cleaned.slice(-4)
  return `••••-••••-••••-${last4}`
}

export default async function LicenseDetailPage({ params }: LicenseDetailPageProps) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    notFound()
  }
  const userId = session.user.id
  const userRole = session.user.role
  const isAdmin = userRole === 'ADMIN'

  const license = await prisma.license.findUnique({
    where: { id },
    include: {
      seats: {
        where: { deletedAt: null },
        include: {
          assignedUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedAsset: {
            select: { id: true, assetTag: true, name: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      category: true,
      manufacturer: true,
    },
  })

  if (!license) {
    notFound()
  }

  // F6 enforcement: EMPLOYEE phải có seat của chính mình.
  const isPrivileged =
    userRole === 'ADMIN' || userRole === 'IT_MANAGER' || userRole === 'IT_STAFF'
  if (!isPrivileged) {
    const ownsSeat = license.seats.some((s) => s.assignedUserId === userId)
    if (!ownsSeat) notFound()
  }

  // Chỉ load users + assets khi user có quyền edit.
  const [users, assets] = isAdmin
    ? await Promise.all([
        prisma.user.findMany({
          where: { activated: true, deletedAt: null },
          select: { id: true, firstName: true, lastName: true, email: true },
          orderBy: { firstName: 'asc' },
        }),
        prisma.asset.findMany({
          where: { deletedAt: null },
          select: { id: true, assetTag: true, name: true },
          orderBy: { assetTag: 'asc' },
        }),
      ])
    : [[], []]

  // Serialize dates
  const serialized = {
    ...license,
    expirationDate: license.expirationDate?.toISOString() ?? null,
    terminationDate: license.terminationDate?.toISOString() ?? null,
    purchaseDate: license.purchaseDate?.toISOString() ?? null,
    createdAt: license.createdAt.toISOString(),
    updatedAt: license.updatedAt.toISOString(),
    seats: license.seats.map((s) => ({
      id: s.id,
      unreassignableSeat: s.unreassignableSeat,
      assignedUserId: s.assignedUserId,
      assignedAssetId: s.assignedAssetId,
      notes: s.notes,
      assignedUser: s.assignedUser,
      assignedAsset: s.assignedAsset,
    })),
  }

  return (
    <LicenseDetailClient
      license={serialized}
      users={users}
      assets={assets}
      isAdmin={isAdmin}
      maskedProductKey={maskProductKey(license.productKey)}
    />
  )
}
