import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import AppearancePrefsForm from '@/components/account/AppearancePrefsForm'

export default async function AppearancePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <div className="text-red-600">Chưa đăng nhập.</div>
  }

  let pref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
  })
  if (!pref) {
    pref = await prisma.userPreference.create({
      data: { userId: session.user.id },
    })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Giao diện</h1>
      <p className="text-gray-500 mb-6">
        Theme + ngôn ngữ hiển thị (user-specific override).
      </p>
      <AppearancePrefsForm theme={pref.theme} locale={pref.locale} />
    </div>
  )
}