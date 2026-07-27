import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import RolesManager from './RolesManager'

export default async function PermissionsPage() {
  try {
    await requirePermission('users.manage_roles')
  } catch {
    redirect('/')
  }
  return <RolesManager />
}