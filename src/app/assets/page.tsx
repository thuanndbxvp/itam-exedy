import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AssetsPageClient from './AssetsPageClient'
import FilterPanel from '@/components/assets/FilterPanel'
import Pagination from '@/components/ui/Pagination'

const ITEMS_PER_PAGE = 20

interface PageProps {
  searchParams: Promise<{
    page?: string
    statusId?: string
    categoryId?: string
    locationId?: string
    assigned?: string
    search?: string
    // Sprint C6 advanced filter
    modelId?: string
    supplierId?: string
    purchaseDateFrom?: string
    purchaseDateTo?: string
    warrantyMonthsMin?: string
    warrantyMonthsMax?: string
    eolDateFrom?: string
    eolDateTo?: string
    byod?: string
    requestable?: string
  }>
}

async function getPageData(params: PageProps['searchParams']) {
  const p = await params
  const page = Math.max(1, parseInt(p.page ?? '1'))
  const skip = (page - 1) * ITEMS_PER_PAGE

  // F4 fix (security audit): EMPLOYEE chỉ thấy asset của mình (assignedUserId === user.id).
  const session = await getServerSession(authOptions)
  const isEmployee = session?.user?.role === 'EMPLOYEE'
  const userId = session?.user?.id

  const where: Record<string, unknown> = { deletedAt: null }
  if (isEmployee && userId) {
    where.assignedUserId = userId
  }

  if (p.statusId) where.statusId = p.statusId
  if (p.categoryId) where.categoryId = p.categoryId
  if (p.locationId) where.assignedLocationId = p.locationId
  if (p.assigned === 'assigned') {
    where.assignedUserId = { not: null }
  } else if (p.assigned === 'unassigned') {
    where.assignedUserId = null
  }
  if (p.search) {
    where.OR = [
      { assetTag: { contains: p.search, mode: 'insensitive' } },
      { name: { contains: p.search, mode: 'insensitive' } },
      { serial: { contains: p.search, mode: 'insensitive' } },
    ]
  }

  // C6: Advanced filter
  if (p.modelId) where.modelId = p.modelId
  if (p.supplierId) where.supplierId = p.supplierId
  if (p.purchaseDateFrom || p.purchaseDateTo) {
    const purchaseFilter: { gte?: Date; lte?: Date } = {}
    if (p.purchaseDateFrom) {
      const d = new Date(p.purchaseDateFrom)
      if (!isNaN(d.getTime())) purchaseFilter.gte = d
    }
    if (p.purchaseDateTo) {
      const d = new Date(p.purchaseDateTo)
      if (!isNaN(d.getTime())) purchaseFilter.lte = d
    }
    if (purchaseFilter.gte || purchaseFilter.lte) where.purchaseDate = purchaseFilter
  }
  if (p.warrantyMonthsMin || p.warrantyMonthsMax) {
    const w: { gte?: number; lte?: number } = {}
    if (p.warrantyMonthsMin) {
      const n = parseInt(p.warrantyMonthsMin)
      if (!isNaN(n)) w.gte = n
    }
    if (p.warrantyMonthsMax) {
      const n = parseInt(p.warrantyMonthsMax)
      if (!isNaN(n)) w.lte = n
    }
    if (w.gte !== undefined || w.lte !== undefined) where.warrantyMonths = w
  }
  if (p.eolDateFrom || p.eolDateTo) {
    const eol: { gte?: Date; lte?: Date } = {}
    if (p.eolDateFrom) {
      const d = new Date(p.eolDateFrom)
      if (!isNaN(d.getTime())) eol.gte = d
    }
    if (p.eolDateTo) {
      const d = new Date(p.eolDateTo)
      if (!isNaN(d.getTime())) eol.lte = d
    }
    if (eol.gte || eol.lte) where.assetEolDate = eol
  }
  if (p.byod === 'true') where.byod = true
  if (p.requestable === 'true') where.requestable = true

  // EMPLOYEE: không cần load full user list (chỉ xem của mình).
  const [assetsRaw, total, statuses, categories, locations, users, transferableAssets, models, suppliers] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        status: true,
        assignedUser: true,
        assignedLocation: true,
        assignedAsset: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.asset.count({ where }),
    prisma.statusLabel.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.location.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    isEmployee
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { activated: true, deletedAt: null },
          select: { id: true, firstName: true, lastName: true, email: true },
          orderBy: { firstName: 'asc' },
        }),
    // B7: list asset khả thi để truyền cho CheckoutAssetButton
    isEmployee
      ? Promise.resolve([])
      : prisma.asset.findMany({
          where: {
            deletedAt: null,
            assignedUserId: null,
            assignedLocationId: null,
            assignedAssetId: null,
            status: { deployable: true, pending: false, archived: false },
          },
          orderBy: { assetTag: 'asc' },
          take: 200,
          select: { id: true, assetTag: true, name: true },
        }),
    // C6: dropdowns cho advanced filter
    prisma.assetModel.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.supplier.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  // Serialize: convert Prisma Decimal → number (Plain objects only for Server → Client)
  const assets = assetsRaw.map((a) => ({
    ...a,
    purchaseCost: a.purchaseCost ? Number(a.purchaseCost) : null,
    purchaseDate: a.purchaseDate?.toISOString() ?? null,
    assetEolDate: a.assetEolDate?.toISOString() ?? null,
    lastAuditDate: a.lastAuditDate?.toISOString() ?? null,
    nextAuditDate: a.nextAuditDate?.toISOString() ?? null,
    lastCheckout: a.lastCheckout?.toISOString() ?? null,
    lastCheckin: a.lastCheckin?.toISOString() ?? null,
    expectedCheckin: a.expectedCheckin?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    deletedAt: a.deletedAt?.toISOString() ?? null,
  }))

  return {
    assets,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    statuses,
    categories,
    locations,
    users,
    transferableAssets,
    models,
    suppliers,
  }
}

export default async function AssetsPage({ searchParams }: PageProps) {
  const data = await getPageData(searchParams)

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Đang tải...</div>}>
        <AssetsPageClient
          assets={data.assets}
          users={data.users}
          locations={data.locations}
          transferableAssets={data.transferableAssets}
          filterNode={
            <FilterPanel
              statuses={data.statuses}
              categories={data.categories}
              locations={data.locations}
              models={data.models}
              suppliers={data.suppliers}
            />
          }
        />
        {data.totalPages > 1 && (
          <div className="flex items-center justify-end bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 mt-4">
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </Suspense>
    </div>
  )
}
