/**
 * /settings/integrations — Sprint C7-C9.
 *
 * Admin-only page gồm 3 tabs:
 *  - API Tokens (C7)
 *  - Email Templates (C8)
 *  - Notification Channels (C9)
 */
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import IntegrationsClient from './IntegrationsClient'

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'IT_MANAGER') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link href="/settings" className="text-sm text-blue-600 hover:underline">
          ← Quay lại Settings
        </Link>
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Bạn không có quyền truy cập trang này.
        </div>
      </div>
    )
  }

  return <IntegrationsClient />
}
