import ChangePasswordForm from '@/components/account/ChangePasswordForm'

export default function PasswordPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Đổi mật khẩu</h1>
      <p className="text-gray-500 mb-6">Đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
      <ChangePasswordForm />
    </div>
  )
}