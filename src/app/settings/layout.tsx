import SettingsSidebar from '@/components/settings/SettingsSidebar'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <SettingsSidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  )
}
