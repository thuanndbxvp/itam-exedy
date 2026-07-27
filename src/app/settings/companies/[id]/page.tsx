import prisma from '@/lib/prisma'
import EditCompanyForm from './EditCompanyForm'
import { notFound } from 'next/navigation'

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await prisma.company.findUnique({ where: { id } })
  if (!company) notFound()
  return <EditCompanyForm company={company} />
}
