'use client'

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { Monitor, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Loader2, CheckCircle2 } from "lucide-react"

type Stage = 'credentials' | 'forgot' | 'forgot-sent' | 'otp'

interface ForgotResponse {
  ok: boolean
  message: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/assets'

  // Stage management
  const [stage, setStage] = useState<Stage>('credentials')

  // Credentials state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotMessage, setForgotMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  // 2FA state
  const [otp, setOtp] = useState("")
  const [, setOtpUserId] = useState<string | null>(null)

  // Common
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Epic D: hiển thị gợi ý tài khoản test khi có env flag.
  const showTestAccounts =
    process.env.NEXT_PUBLIC_SHOW_TEST_ACCOUNTS === 'true'

  /**
   * Step 1: validate credentials via custom endpoint.
   * If 2FA required → move to OTP stage.
   * Else → call NextAuth signIn().
   */
  async function handleCredentialSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Email hoặc mật khẩu không đúng.')
        setLoading(false)
        return
      }

      if (data.require2FA) {
        setOtpUserId(data.userId)
        setStage('otp')
        setLoading(false)
        return
      }

      // No 2FA → NextAuth signIn
      await completeNextAuthSignIn()
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  async function completeNextAuthSignIn() {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      // Nếu NextAuth throw REQUIRES_2FA error → bật lại OTP stage
      if (result.error.includes('REQUIRES_2FA') || result.error.includes('2FA')) {
        setStage('otp')
        setLoading(false)
        return
      }
      setError('Email hoặc mật khẩu không đúng.')
      setLoading(false)
      return
    }
    if (result?.ok) {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setError('Mã phải là 6 chữ số.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Mã OTP không hợp lệ.')
        setOtp('')
        setLoading(false)
        return
      }

      // 2FA passed → NextAuth signIn sẽ bypass 2FA gate qua cookie
      await completeNextAuthSignIn()
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setForgotMessage(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data: ForgotResponse = await res.json()

      // Always show generic success — doesn't reveal whether email exists
      setForgotMessage({ kind: 'success', text: data.message })
      setLoading(false)
      setStage('forgot-sent')
    } catch {
      setForgotMessage({ kind: 'error', text: 'Đã xảy ra lỗi. Vui lòng thử lại.' })
      setLoading(false)
    }
  }

  function resetToCredentials() {
    setStage('credentials')
    setError(null)
    setForgotMessage(null)
    setOtp('')
    setOtpUserId(null)
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            IT Asset Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hệ thống quản lý tài sản nội bộ cấp doanh nghiệp
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* STAGE 1: Credentials */}
        {stage === 'credentials' && (
          <form className="mt-8 space-y-6" onSubmit={handleCredentialSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Tài khoản Email
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm bg-slate-50"
                  placeholder="admin@congty.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm bg-white"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStage('forgot')}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Quên mật khẩu?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-5 h-5" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    Đăng nhập hệ thống
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STAGE 2: Forgot password */}
        {stage === 'forgot' && (
          <form className="mt-8 space-y-6" onSubmit={handleForgotSubmit}>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Quên mật khẩu</h3>
              <p className="text-sm text-gray-600">Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
            </div>
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm bg-slate-50"
                  placeholder="email@congty.com"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetToCredentials}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white disabled:opacity-70 inline-flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Gửi link'}
              </button>
            </div>
          </form>
        )}

        {/* STAGE 2b: Forgot sent confirmation */}
        {stage === 'forgot-sent' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-start space-x-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-4 rounded-xl">
              <CheckCircle2 size={22} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Đã gửi yêu cầu</p>
                <p className="text-sm mt-1">
                  {forgotMessage?.text || 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi trong ít phút.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetToCredentials}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Quay lại trang đăng nhập
            </button>
          </div>
        )}

        {/* STAGE 3: OTP 2FA */}
        {stage === 'otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <KeyRound size={20} className="text-blue-600" />
                Xác thực 2 bước
              </h3>
              <p className="text-sm text-gray-600">
                Mở ứng dụng Authenticator (Google/Microsoft/Authy) trên điện thoại và nhập mã 6 số hiện tại.
              </p>
            </div>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Mã OTP (6 số)
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoFocus
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="mt-2 block w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono bg-slate-50"
                placeholder="000000"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetToCredentials}
                disabled={loading}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white disabled:opacity-70 inline-flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Xác nhận'}
              </button>
            </div>
          </form>
        )}

        {/* Test accounts hint */}
        {showTestAccounts && stage === 'credentials' && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              <strong>Tài khoản test:</strong> admin@congty.com / password123 (hoặc nhanvien@congty.com)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
