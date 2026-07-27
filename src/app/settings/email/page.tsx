/**
 * Email Settings — UI-defined SMTP config (Phase 4 Epic H).
 */
import { getEmailSettingsAction } from '@/app/actions/email-settings'
import EmailSettingsForm from '@/components/settings/EmailSettingsForm'

export default async function EmailPage() {
  const result = await getEmailSettingsAction()
  if (!result.ok) {
    return <div className="text-red-600">Lỗi: {result.message}</div>
  }
  if (!result.data) {
    return <div className="text-red-600">Lỗi: Không thể tải cấu hình.</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Email</h1>
      <p className="text-gray-500 mb-6">Cấu hình SMTP để gửi email thông báo.</p>

      <EmailSettingsForm initialData={result.data} />
    </div>
  )
}