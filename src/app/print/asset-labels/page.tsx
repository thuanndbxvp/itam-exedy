/**
 * /print/asset-labels — Sprint C1.
 *
 * Multi-select assets → print QR labels (3 cols × N rows).
 *
 * Print flow:
 *  1. User chọn assets (search + checkboxes)
 *  2. Click "In nhãn" → gọi /api/print/asset-labels?ids=...
 *     hoặc render client-side QR bằng `qr-generator`.
 *  3. `@media print` ẩn UI controls, chỉ hiển thị grid labels.
 *
 * Implementation: Server Component fetch list assets deployable; Client Component
 * handle selection + render QR inline.
 */
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import PrintLabelsClient from '@/components/print/PrintLabelsClient'

export default async function PrintAssetLabelsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get base URL for QR deep-link
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const baseUrl = `${proto}://${host}`

  // Fetch deployable assets (print nhãn thường áp cho asset đang trong kho)
  const assets = await prisma.asset.findMany({
    where: { deletedAt: null },
    orderBy: { assetTag: 'asc' },
    take: 500,
    select: {
      id: true,
      assetTag: true,
      name: true,
      serial: true,
      status: { select: { name: true, color: true } },
      model: { select: { name: true } },
      category: { select: { name: true } },
    },
  })

  const simplified = assets.map((a) => ({
    id: a.id,
    assetTag: a.assetTag,
    name: a.name,
    serial: a.serial,
    statusName: a.status.name,
    statusColor: a.status.color ?? '#6b7280',
    modelName: a.model?.name ?? '',
    categoryName: a.category?.name ?? '',
  }))

  return (
    <PrintLabelsClient assets={simplified} baseUrl={baseUrl} />
  )
}
