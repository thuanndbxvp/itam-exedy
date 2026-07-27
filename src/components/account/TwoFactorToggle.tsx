'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { toggleTwoFactorOptinAction } from '@/app/actions/account-preferences'
import { KeyRound, Loader2, AlertCircle } from 'lucide-react'

export default function TwoFactorToggle({
  initialOptin,
}: {
  initialOptin: boolean
}) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [optin, setOptin] = useState(initialOptin)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !optin
    setOptin(next) // optimistic
    startTransition(async () => {
      const result = await toggleTwoFactorOptinAction({ optin: next })
      if (result.ok) {
        showCommandResult(
          result,
          next ? 'Đã bật ý định 2FA.' : 'Đã tắt ý định 2FA.'
        )
        router.refresh()
      } else {
        // revert
        setOptin(!next)
        showCommandResult(result)
      }
    })
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
          <KeyRound size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Xác thực 2 yếu tố (2FA)</h3>
          <p className="text-sm text-gray-500 mt-1">
            Bật/tắt ý định sử dụng 2FA. Khi Epic M hoàn thiện, OTP sẽ được gửi qua
            email mỗi lần đăng nhập nếu bật.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggle}
              disabled={isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                optin ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={optin}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  optin ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                optin ? 'text-emerald-700' : 'text-gray-500'
              }`}
            >
              {optin ? 'Đã bật' : 'Chưa bật'}
            </span>
            {isPending && <Loader2 size={14} className="animate-spin text-gray-400" />}
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              Lưu ý: Tính năng 2FA thật (TOTP/OTP) sẽ được triển khai ở Phase sau.
              Hiện tại chỉ lưu flag ý định.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}