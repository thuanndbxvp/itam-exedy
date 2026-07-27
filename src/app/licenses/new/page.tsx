import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import LicenseForm from '../LicenseForm'

export default async function NewLicensePage() {
  const [categories, manufacturers, suppliers] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null, categoryType: 'LICENSE' },
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
  ])

  if (!categories.length) {
    // Fallback: allow all categories
  }

  const licenseCategories = categories.length
    ? categories
    : await prisma.category.findMany({ where: { deletedAt: null }, select: { id: true, name: true } })

  return (
    <LicenseForm
      categories={licenseCategories}
      manufacturers={manufacturers}
      suppliers={suppliers}
    />
  )
}