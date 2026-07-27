/**
 * General Settings — F-1: company name, currency, timezone, language.
 *
 * Phase 1 admin phải có UI để thay đổi cấu hình hệ thống mà không cần sửa DB.
 */
import { getSettingsAction, updateGeneralSettingsAction } from '@/app/actions/settings'
import SettingsForm from '@/components/settings/SettingsForm'

export default async function GeneralSettingsPage() {
  const result = await getSettingsAction()

  if (!result.ok) {
    return (
      <div className="text-red-600">Lỗi: {result.message}</div>
    )
  }

  const settings = {
    ...result.data!,
    // Map DB emailFrom -> UI supportEmail
    supportEmail: result.data!.emailFrom ?? '',
  }

  const fields = [
    {
      name: 'companyName',
      label: 'Tên công ty',
      icon: 'globe' as const,
      type: 'text' as const,
      required: true,
      description: 'Tên hiển thị trên dashboard và email thông báo.',
    },
    {
      name: 'supportEmail',
      label: 'Email hỗ trợ',
      icon: 'globe' as const,
      type: 'text' as const,
      description: 'Địa chỉ email liên hệ người dùng gặp sự cố. Cũng được dùng làm email gửi đi mặc định.',
      placeholder: 'VD: support@congty.com',
    },
    {
      name: 'currency',
      label: 'Đơn vị tiền tệ',
      icon: 'globe' as const,
      type: 'select' as const,
      required: true,
      options: [
        { value: 'VND', label: 'VND (Việt Nam Đồng)' },
        { value: 'USD', label: 'USD (US Dollar)' },
        { value: 'EUR', label: 'EUR (Euro)' },
        { value: 'SGD', label: 'SGD (Singapore Dollar)' },
      ],
      description: 'Đơn vị tiền tệ mặc định cho chi phí tài sản.',
    },
    {
      name: 'timezone',
      label: 'Múi giờ',
      icon: 'globe' as const,
      type: 'select' as const,
      required: true,
      options: [
        { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
        { value: 'UTC', label: 'UTC (GMT+0)' },
      ],
      description: 'Múi giờ cho báo cáo và ngày tạo record.',
    },
    {
      name: 'locale',
      label: 'Ngôn ngữ',
      icon: 'globe' as const,
      type: 'select' as const,
      required: true,
      options: [
        { value: 'vi-VN', label: 'Tiếng Việt' },
        { value: 'en-US', label: 'English' },
      ],
      description: 'Ngôn ngữ hiển thị cho toàn bộ giao diện.',
    },
  ]

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Cài đặt tổng quan</h1>
      <p className="text-gray-500 mb-6">Cấu hình cơ bản của hệ thống.</p>

      <SettingsForm
        title="Thông tin công ty"
        initialData={settings}
        fields={fields}
        onSubmit={async (data) => {
          'use server'
          return updateGeneralSettingsAction({
            companyName: data.companyName as string,
            currency: data.currency as string,
            timezone: data.timezone as string,
            locale: data.locale as string,
            supportEmail: (data.supportEmail as string) ?? '',
          })
        }}
      />
    </div>
  )
}
