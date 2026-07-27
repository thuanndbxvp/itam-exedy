'use client'

/**
 * /reset-password — Sprint B16.
 *
 * Trang đặt lại mật khẩu từ link trong email.
 *
 * URL: /reset-password?token=<raw>
 *
 * Luồng:
 *  1. Đọc token từ URL
 *  2. Form nhập pass mới (2 lần)
 *  3. POST /api/auth/reset-password { token, newPassword }
 *  4. OK → redirect /login với toast message
 *  5. Err → hiển thị lỗi
 */

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Monitor } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Token không hợp lệ. Vui lòng kiểm tra lại link email.')
      return
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Đặt lại mật khẩu thất bại.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      // Auto-redirect sau 2.5s
      setTimeout(() => {
        router.push('/login?reset=success')
      }, 2500)
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Link không hợp lệ</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Vui lòng kiểm tra link email và thử lại, hoặc yêu cầu link mới.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="mt-8 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white"
          >
            Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Thành công</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Mật khẩu đã được đặt lại. Đang chuyển đến trang đăng nhập...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Nhập lại mật khẩu
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white disabled:opacity-70 inline-flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
