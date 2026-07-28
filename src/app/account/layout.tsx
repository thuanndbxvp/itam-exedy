/**
 * User Panel layout — horizontal tab nav cho self-service.
 * Require session. Redirect /login nếu chưa đăng nhập.
 */
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import UserPanelNav from '@/components/account/UserPanelNav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <UserPanelNav />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  )
}
