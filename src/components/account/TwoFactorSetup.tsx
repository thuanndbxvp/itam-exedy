'use client'

/**
 * TwoFactorSetup — Sprint B17.
 *
 * Client Component: hỗ trợ 3 stage:
 *  1. NOT_ENROLLED → nút "Bật 2FA" → POST /api/auth/2fa/setup → lưu secret tạm,
 *     hiển thị QR + ô nhập OTP.
 *  2. SETUP (có secret tạm chưa verify) → nhập OTP → POST /api/auth/2fa/verify → enrolled.
 *  3. ENROLLED → hiển thị trạng thái + nút "Tắt 2FA" (cần nhập password).
 *
 * Audit: setup → TWO_FACTOR_ENABLED (verify), disable → TWO_FACTOR_DISABLED.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { KeyRound, Loader2, AlertCircle, CheckCircle2, Shield, X } from 'lucide-react'

interface Props {
  initialEnrolled: boolean
}

type SetupData = {
  secret: string
  qrCodeDataUri: string
  otpauthUri: string
}

export default function TwoFactorSetup({ initialEnrolled }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [otp, setOtp] = useState('')
  const [isPending, startTransition] = useTransition()

  // Disable state
  const [showDisable, setShowDisable] = useState(false)
  const [password, setPassword] = useState('')

  async function handleSetup() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) {
          showCommandResult({
            ok: false,
            code: data.code ?? 'SETUP_FAILED',
            message: data.message ?? 'Setup thất bại.',
          })
          return
        }
        setSetupData(data.data)
        setOtp('')
      } catch {
        showCommandResult({
          ok: false,
          code: 'NETWORK',
          message: 'Lỗi mạng. Vui lòng thử lại.',
        })
      }
    })
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(otp)) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Mã phải là 6 chữ số.' })
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/2fa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: otp }),
        })
        const data = await res.json()
        if (!res.ok) {
          showCommandResult({
            ok: false,
            code: data.code ?? 'VERIFY_FAILED',
            message: data.message ?? 'Mã OTP không hợp lệ.',
          })
          setOtp('')
          return
        }
        showCommandResult(data, 'Đã bật xác thực 2 bước.')
        setEnrolled(true)
        setSetupData(null)
        setOtp('')
        router.refresh()
      } catch {
        showCommandResult({
          ok: false,
          code: 'NETWORK',
          message: 'Lỗi mạng.',
        })
      }
    })
  }

  async function handleDisable() {
    if (!password) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Nhập mật khẩu để xác nhận.' })
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/2fa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const data = await res.json()
        if (!res.ok) {
          showCommandResult({
            ok: false,
            code: data.code ?? 'DISABLE_FAILED',
            message: data.message ?? 'Tắt 2FA thất bại.',
          })
          setPassword('')
          return
        }
        showCommandResult(data, 'Đã tắt xác thực 2 bước.')
        setEnrolled(false)
        setShowDisable(false)
        setPassword('')
        router.refresh()
      } catch {
        showCommandResult({
          ok: false,
          code: 'NETWORK',
          message: 'Lỗi mạng.',
        })
      }
    })
  }

  function handleCancelSetup() {
    setSetupData(null)
    setOtp('')
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
          <KeyRound size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Xác thực 2 yếu tố (2FA TOTP)</h3>
          <p className="text-sm text-gray-500 mt-1">
            Tăng cường bảo mật bằng cách yêu cầu mã 6 số (Google Authenticator, Microsoft Authenticator, Authy...) khi đăng nhập.
          </p>

          {/* ENROLLED STATE */}
          {enrolled && !setupData && !showDisable && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Đã bật 2FA. Tài khoản của bạn an toàn hơn.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDisable(true)}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X size={14} className="mr-1" />
                Tắt 2FA
              </button>
            </div>
          )}

          {/* DISABLE FORM */}
          {enrolled && showDisable && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-red-700 mb-3">
                Để tắt 2FA, vui lòng nhập mật khẩu hiện tại của bạn:
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu hiện tại"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisable(false)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDisable}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 inline-flex items-center"
                >
                  {isPending && <Loader2 className="animate-spin mr-1 w-4 h-4" />}
                  Xác nhận tắt
                </button>
              </div>
            </div>
          )}

          {/* NOT ENROLLED + no setupData → nút bật */}
          {!enrolled && !setupData && (
            <button
              type="button"
              onClick={handleSetup}
              disabled={isPending}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Đang sinh secret...
                </>
              ) : (
                <>
                  <Shield size={14} className="mr-2" />
                  Bật 2FA
                </>
              )}
            </button>
          )}

          {/* SETUP (có QR + ô nhập OTP) */}
          {!enrolled && setupData && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setupData.qrCodeDataUri}
                    alt="2FA QR code"
                    width={180}
                    height={180}
                    className="rounded-lg border border-gray-200 bg-white p-2"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-gray-900">Bước 1: Quét mã QR</p>
                  <p className="text-xs text-gray-600">
                    Mở Authenticator trên điện thoại, chọn &quot;+&quot; → Quét mã QR.
                  </p>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer text-blue-600">Không quét được? Nhập thủ công</summary>
                    <code className="block mt-2 p-2 bg-white border border-gray-200 rounded font-mono break-all">
                      {setupData.secret}
                    </code>
                  </details>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Bước 2: Nhập mã 6 số hiện tại trong app
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="block w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono bg-white"
                  autoFocus
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelSetup}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isPending || otp.length !== 6}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 inline-flex items-center"
                  >
                    {isPending && <Loader2 className="animate-spin mr-1 w-4 h-4" />}
                    Xác nhận
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  Backup codes chưa được implement trong phiên bản này. Hãy giữ điện thoại an toàn — nếu mất, bạn sẽ cần admin reset.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
