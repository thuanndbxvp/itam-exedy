'use client'

import { Shield, Mail, User, Lock, KeyRound, Clock } from 'lucide-react'

function maskEmail(email: string): string {
  if (email === '—') return email
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const maskedLocal = local[0] + '***'
  const dotIndex = domain.indexOf('.')
  const maskedDomain =
    dotIndex === -1
      ? domain[0] + '***'
      : domain[0] + '***' + domain.slice(dotIndex)
  return `${maskedLocal}@${maskedDomain}`
}

function formatVi(date: Date | null | undefined): string {
  if (!date) return 'Chưa bao giờ'
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SecurityInfoCard({
  email,
  username,
  passwordChangedAt,
  twoFactorEnrolled,
  accountCreatedAt,
}: {
  email: string
  username: string
  passwordChangedAt: Date | null
  twoFactorEnrolled: boolean
  accountCreatedAt: Date
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y">
      <Row icon={Mail} label="Email" value={maskEmail(email)} />
      <Row icon={User} label="Username" value={username} />
      <Row
        icon={Lock}
        label="Mật khẩu đã đổi lần cuối"
        value={formatVi(passwordChangedAt)}
      />
      <Row
        icon={KeyRound}
        label="2FA (Xác thực 2 yếu tố)"
        value={
          twoFactorEnrolled ? (
            <span className="text-emerald-600 font-medium">Đã bật</span>
          ) : (
            <span className="text-gray-500">Chưa bật (sẽ có ở Phase 5)</span>
          )
        }
      />
      <Row icon={Clock} label="Tài khoản tạo lúc" value={formatVi(accountCreatedAt)} />

      <div className="p-6">
        <div className="flex items-start gap-3">
          <Shield size={20} className="mt-0.5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">Phiên đăng nhập (Sessions)</p>
            <p className="text-xs text-gray-500 mt-1">
              Tính năng xem và thu hồi phiên đăng nhập sẽ có ở Phase 5.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="p-6 flex items-start gap-3">
      <Icon size={20} className="mt-0.5 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <div className="text-sm text-gray-600 mt-1 break-all">{value}</div>
      </div>
    </div>
  )
}