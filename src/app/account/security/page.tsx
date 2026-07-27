import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import SecurityInfoCard from '@/components/account/SecurityInfoCard'
import TwoFactorToggle from '@/components/account/TwoFactorToggle'
import LoginHistoryCard from '@/components/account/LoginHistoryCard'

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

  // B13: lấy 20 LOGIN gần nhất của user này.
  const loginHistoryRaw = await prisma.actionLog.findMany({
    where: {
      userId: session.user.id,
      actionType: 'LOGIN',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      createdAt: true,
      ipAddress: true,
      userAgent: true,
    },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Bảo mật</h1>
        <p className="text-gray-500">Thông tin tài khoản và bảo mật.</p>
      </div>

      <SecurityInfoCard
        email={user.email ?? '—'}
        username={user.username ?? '—'}
        passwordChangedAt={user.passwordChangedAt}
        twoFactorEnrolled={user.twoFactorEnrolled}
        accountCreatedAt={user.createdAt}
      />

      {/* B12: toggle 2FA intent */}
      <TwoFactorToggle initialOptin={user.twoFactorOptin} />

      {/* B13: login history */}
      <LoginHistoryCard history={loginHistoryRaw} />
    </div>
  )
}