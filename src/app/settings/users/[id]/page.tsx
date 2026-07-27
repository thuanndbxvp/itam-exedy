import prisma from '@/lib/prisma'
import EditUserForm from './EditUserForm'
import { notFound } from 'next/navigation'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, include: { department: true } })
  if (!user) notFound()
  return <EditUserForm user={user} />
}
