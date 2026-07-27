import prisma from '@/lib/prisma'
import EditStatusForm from './EditStatusForm'
import { notFound } from 'next/navigation'

export default async function EditStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const status = await prisma.statusLabel.findUnique({ where: { id } })
  if (!status) notFound()

  return <EditStatusForm status={status} />
}
