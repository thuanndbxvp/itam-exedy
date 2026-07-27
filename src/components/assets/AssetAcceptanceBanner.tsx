'use client'

/**
 * AssetAcceptanceBanner — Sprint C4.
 *
 * Hiển thị trên asset detail page nếu user hiện tại là `assignedUserId`
 * và chưa accept. Cho phép accept/decline 1-click.
 *
 * Nếu user đã accept → show "Đã xác nhận nhận asset".
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2, PackageCheck } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Props {
  assetId: string
  assetTag: string
  /** Trạng thái cuối — server pre-calc dựa trên ActionLog ACCEPTED gần nhất. */
  initialStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'NOT_ASSIGNED'
}

export default function AssetAcceptanceBanner({ assetId, assetTag, initialStatus }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  // Status derived; no effect needed

  if (status === 'NOT_ASSIGNED') return null

  if (status === 'ACCEPTED') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-emerald-900 text-sm">Bạn đã xác nhận nhận asset này</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Cảm ơn bạn đã xác nhận. Nếu có vấn đề, báo helpdesk.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'DECLINED') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <XCircle size={20} className="text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-amber-900 text-sm">
            Bạn đã từ chối nhận asset này
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            IT sẽ liên hệ lại để xác nhận lại. Liên hệ{' '}
            <Link href="/helpdesk/new" className="underline">
              tạo ticket
            </Link>{' '}
            nếu cần hỗ trợ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatus('PENDING')}
          className="px-3 py-1.5 text-xs border border-amber-300 rounded-lg hover:bg-amber-100"
        >
          Xem lại
        </button>
      </div>
    )
  }

  async function handleAction(action: 'accept' | 'decline') {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/assets/${assetId}/accept-decline`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        const json = await res.json()
        if (json.ok) {
          showCommandResult(json, json.data.message)
          setStatus(action === 'accept' ? 'ACCEPTED' : 'DECLINED')
          router.refresh()
        } else {
          showCommandResult(json)
        }
      } catch {
        showCommandResult({
          ok: false,
          code: 'NETWORK',
          message: 'Lỗi kết nối.',
        })
      }
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <PackageCheck size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-blue-900 text-sm">
            Bạn đã được cấp phát asset <span className="font-mono">{assetTag}</span>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Vui lòng xác nhận đã nhận (nếu bạn có asset) hoặc từ chối (nếu chưa nhận được).
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAction('accept')}
              disabled={isPending}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              <CheckCircle2 size={14} className="mr-1" />
              Xác nhận đã nhận
            </button>
            <button
              type="button"
              onClick={() => handleAction('decline')}
              disabled={isPending}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
            >
              <XCircle size={14} className="mr-1" />
              Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}