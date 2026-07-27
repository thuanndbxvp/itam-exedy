/**
 * Email Settings — F-9: SMTP config (placeholder for Phase 2.2).
 */
import { getSettingsAction } from '@/app/actions/settings'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function EmailPage() {
  const result = await getSettingsAction()
  if (!result.ok) return <div className="text-red-600">Lỗi: {result.message}</div>
  const settings = { ...result.data! }

  const fields = [
    {
      name: 'emailFrom',
      label: 'Email gửi',
      icon: 'mail' as const,
      type: 'text' as const,
      description: 'Địa chỉ email dùng làm người gửi.',
      placeholder: 'noreply@congty.com',
    },
    {
      name: 'emailFromName',
      label: 'Tên người gửi',
      icon: 'mail' as const,
      type: 'text' as const,
      description: 'Tên hiển thị khi gửi email.',
    },
    {
      name: 'smtpHost',
      label: 'SMTP Host',
      icon: 'mail' as const,
      type: 'text' as const,
      description: 'Địa chỉ server SMTP (VD: smtp.gmail.com).',
    },
    {
      name: 'smtpPort',
      label: 'SMTP Port',
      icon: 'mail' as const,
      type: 'text' as const,
      description: 'Cổng SMTP (VD: 587 cho TLS, 465 cho SSL).',
    },
    {
      name: 'smtpUsername',
      label: 'SMTP Username',
      icon: 'mail' as const,
      type: 'text' as const,
      description: 'Tài khoản SMTP.',
    },
    {
      name: 'smtpPassword',
      label: 'SMTP Password',
      icon: 'mail' as const,
      type: 'text' as const,
      description: 'Mật khẩu SMTP. Sẽ được mã hóa ở Phase 3.',
    },
  ]

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Email</h1>
      <p className="text-gray-500 mb-6">Cấu hình SMTP để gửi email thông báo.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Chú ý:</strong> Tính năng gửi email thật sự sẽ được kích hoạt ở Phase 2.2.
          Hiện tại bạn có thể lưu cấu hình SMTP nhưng hệ thống chưa gửi email.
        </p>
      </div>

      <SettingsForm
        title="Cấu hình SMTP"
        initialData={settings}
        fields={fields}
        onSubmit={async () => {
          'use server'
          // Placeholder — sẽ viết action riêng ở Phase 2.2
          return { ok: true, data: undefined } as never
        }}
      />
    </div>
  )
}
