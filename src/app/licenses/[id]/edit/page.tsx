import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import LicenseForm from '../../LicenseForm'

interface PageProps { params: Promise<{ id: string }> }

export default async function EditLicensePage({ params }: PageProps) {
  const { id } = await params

  const license = await prisma.license.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      productKey: true,
      serial: true,
      categoryId: true,
      manufacturerId: true,
      supplierId: true,
      companyId: true,
      expirationDate: true,
      terminationDate: true,
      reassignable: true,
      maintained: true,
      purchaseDate: true,
      purchaseCost: true,
      purchaseOrder: true,
      orderNumber: true,
      notes: true,
      licenseEmail: true,
      licenseName: true,
      minAmt: true,
    },
  })

  if (!license) notFound()

  const [categories, manufacturers, suppliers, companies] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.manufacturer.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const serialized = {
    ...license,
    purchaseCost: license.purchaseCost ? Number(license.purchaseCost) : null,
    purchaseDate: license.purchaseDate?.toISOString() ?? null,
    expirationDate: license.expirationDate?.toISOString() ?? null,
    terminationDate: license.terminationDate?.toISOString() ?? null,
  }

  return (
    <LicenseForm
      license={serialized}
      categories={categories}
      manufacturers={manufacturers}
      suppliers={suppliers}
      companies={companies}
    />
  )
}