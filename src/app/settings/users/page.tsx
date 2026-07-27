/**
 * Users Settings — F-5: User list + CRUD + role assignment.
 */
import prisma from '@/lib/prisma'
import UsersTable from '@/components/settings/UsersTable'
import { requireRole } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { department: true, company: true },
  })
}

export default async function UsersPage() {
  try {
    await requireRole('ADMIN')
  } catch {
    redirect('/')
  }

  const users = await getUsers()

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Người dùng</h1>
          <p className="text-gray-500">Quản lý tài khoản và phân quyền người dùng.</p>
        </div>
        <Link href="/settings/users/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
          + Thêm người dùng
        </Link>
      </div>
      <UsersTable users={users} />
    </div>
  )
}
