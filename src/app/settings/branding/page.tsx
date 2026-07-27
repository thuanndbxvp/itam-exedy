/**
 * Branding Settings — F-2: logo URL + primary color.
 */
import { getSettingsAction, updateBrandingSettingsAction } from '@/app/actions/settings'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function BrandingPage() {
  const result = await getSettingsAction()
  if (!result.ok) return <div className="text-red-600">Lỗi: {result.message}</div>

  const settings = { ...result.data! }

  const fields = [
    {
      name: 'logoUrl',
      label: 'Logo URL',
      icon: 'palette' as const,
      type: 'text' as const,
      description: 'Dán URL ảnh logo (VD: https://example.com/logo.png). Không upload file ở Phase 2.',
      placeholder: 'https://...',
    },
    {
      name: 'primaryColor',
      label: 'Màu chủ đạo',
      icon: 'palette' as const,
      type: 'color' as const,
      required: true,
      description: 'Màu chủ đạo cho nút, icon và các thành phần tương tác.',
    },
  ]

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Thương hiệu</h1>
      <p className="text-gray-500 mb-6">Cấu hình logo và màu sắc thương hiệu.</p>
      <SettingsForm
        title="Logo & Màu sắc"
        initialData={settings}
        fields={fields}
        onSubmit={async (data) => {
          'use server'
          return updateBrandingSettingsAction({
            logoUrl: data.logoUrl as string,
            primaryColor: data.primaryColor as string,
          })
        }}
      />
    </div>
  )
}
