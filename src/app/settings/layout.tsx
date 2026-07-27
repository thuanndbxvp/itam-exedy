import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SettingsBreadcrumb from '@/components/settings/SettingsBreadcrumb'

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
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <SettingsBreadcrumb />
        {children}
      </main>
    </div>
  )
}
