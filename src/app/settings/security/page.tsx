/**
 * Security Settings — F-3: password policy, session timeout, 2FA.
 */
import { getSettingsAction, updateSecuritySettingsAction } from '@/app/actions/settings'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function SecurityPage() {
  const result = await getSettingsAction()
  if (!result.ok) return <div className="text-red-600">Lỗi: {result.message}</div>

  const settings = { ...result.data! }

  const fields = [
    {
      name: 'passwordMinLength',
      label: 'Độ dài mật khẩu tối thiểu',
      icon: 'shield' as const,
      type: 'number' as const,
      required: true,
      description: 'Số ký tự tối thiểu cho mật khẩu mới.',
    },
    {
      name: 'passwordRequireSpecial',
      label: 'Yêu cầu ký tự đặc biệt',
      icon: 'shield' as const,
      type: 'checkbox' as const,
      description: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$...).',
    },
    {
      name: 'sessionTimeoutMinutes',
      label: 'Thời gian chờ phiên (phút)',
      icon: 'shield' as const,
      type: 'select' as const,
      required: true,
      options: [
        { value: '30', label: '30 phút' },
        { value: '60', label: '1 giờ' },
        { value: '240', label: '4 giờ' },
        { value: '480', label: '8 giờ' },
        { value: '1440', label: '24 giờ' },
      ],
      description: 'Tự động đăng xuất sau khoảng thời gian không hoạt động.',
    },
    {
      name: 'twoFactorEnabled',
      label: 'Bật xác thực 2FA',
      icon: 'shield' as const,
      type: 'checkbox' as const,
      description: 'Yêu cầu xác thực 2 lớp khi đăng nhập. Tính năng enroll ở Phase 3.',
    },
  ]

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bảo mật</h1>
      <p className="text-gray-500 mb-6">Cấu hình chính sách mật khẩu và bảo mật.</p>
      <SettingsForm
        title="Chính sách bảo mật"
        initialData={settings}
        fields={fields}
        onSubmit={async (data) => {
          'use server'
          return updateSecuritySettingsAction({
            passwordMinLength: parseInt(data.passwordMinLength as string),
            passwordRequireSpecial: data.passwordRequireSpecial as boolean,
            sessionTimeoutMinutes: parseInt(data.sessionTimeoutMinutes as string),
            twoFactorEnabled: data.twoFactorEnabled as boolean,
          })
        }}
      />
    </div>
  )
}
