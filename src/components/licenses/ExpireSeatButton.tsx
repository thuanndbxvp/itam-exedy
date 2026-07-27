'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, Loader2 } from 'lucide-react'
import { expireLicenseSeatCmd } from '@/app/actions/license'
import { useToast } from '@/components/Toast'

interface Props {
  seatId: string
  state: 'AVAILABLE' | 'ASSIGNED' | 'EXPIRED'
}

export default function ExpireSeatButton({ seatId, state }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, startTransition] = useTransition()

  if (state === 'EXPIRED') {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs text-gray-400 italic">
        Expired
      </span>
    )
  }

  function handleClick() {
    if (isPending) return
    const reason = window.prompt('Lý do expire seat (tùy chọn):') ?? undefined
    if (reason === null) return // user cancelled
    startTransition(async () => {
      const result = await expireLicenseSeatCmd({ seatId, reason: reason || undefined })
      showCommandResult(result, 'Đã expire seat.')
      if (result && typeof result === 'object' && 'ok' in result && (result as { ok: boolean }).ok) {
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition border border-red-200 disabled:opacity-50"
      title="Đánh dấu seat này là expired/unreassignable"
    >
      {isPending ? (
        <Loader2 size={12} className="mr-1 animate-spin" />
      ) : (
        <XCircle size={12} className="mr-1" />
      )}
      Expire
    </button>
  )
}