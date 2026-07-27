import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import UserPermissionsClient from './UserPermissionsClient'

export default async function UserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('users.manage_roles')
  } catch {
    redirect('/')
  }

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) notFound()

  return <UserPermissionsClient userId={id} />
}