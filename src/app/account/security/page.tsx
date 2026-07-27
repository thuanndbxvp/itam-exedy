import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import SecurityInfoCard from '@/components/account/SecurityInfoCard'

export default async function SecurityPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <div className="text-red-600">Chưa đăng nhập.</div>
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      username: true,
      passwordChangedAt: true,
      twoFactorEnrolled: true,
      twoFactorOptin: true,
      createdAt: true,
    },
  })

  if (!user) {
    return <div className="text-red-600">Không tìm thấy user.</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bảo mật</h1>
      <p className="text-gray-500 mb-6">Thông tin tài khoản và bảo mật.</p>
      <SecurityInfoCard
        email={user.email ?? '—'}
        username={user.username ?? '—'}
        passwordChangedAt={user.passwordChangedAt}
        twoFactorEnrolled={user.twoFactorEnrolled}
        accountCreatedAt={user.createdAt}
      />
    </div>
  )
}