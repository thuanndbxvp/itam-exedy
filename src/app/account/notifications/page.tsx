import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import NotificationPrefsForm from '@/components/account/NotificationPrefsForm'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <div className="text-red-600">Chưa đăng nhập.</div>
  }

  let pref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
  })

  // Backfill nếu user cũ chưa có (Sprint D đã seed, nhưng defensive)
  if (!pref) {
    pref = await prisma.userPreference.create({
      data: { userId: session.user.id },
    })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Thông báo</h1>
      <p className="text-gray-500 mb-6">
        Cấu hình email digest và tạm tắt thông báo.
      </p>
      <NotificationPrefsForm
        emailDigestFrequency={pref.emailDigestFrequency}
        muteUntil={pref.muteUntil?.toISOString() ?? null}
      />
    </div>
  )
}