'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { checkinLicenseSeatCmd } from '@/app/actions/license'
import { useToast } from '@/components/Toast'
import { ShoppingCart, Undo2, Loader2, XCircle } from 'lucide-react'
import CheckoutSeatModal from './CheckoutSeatModal'

interface CheckoutSeatButtonProps {
  seatId: string
  seatLabel: string
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  assets: { id: string; assetTag: string; name: string }[]
  /** Trạng thái seat hiện tại (để render nút phù hợp). */
  state: 'AVAILABLE' | 'ASSIGNED' | 'EXPIRED'
}

/**
 * Nút composite cho LicenseSeat — render Checkout/Checkin/Expire tùy trạng thái.
 * Phase 1: chỉ Checkout + Checkin (Expire làm sau nếu cần).
 *
 * Phase 1: chỉ ADMIN (wrap trong <RoleGate> ở licenses/[id]/page.tsx).
 * Server actions enforce `requirePermission('licenses.assign')` — UI chỉ là cosmetic.
 */
export default function CheckoutSeatButton({
  seatId,
  seatLabel,
  users,
  assets,
  state,
}: CheckoutSeatButtonProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCheckin() {
    if (isPending) return
    const confirmed = window.confirm(
      `Thu hồi LicenseSeat "${seatLabel}"? Hành động này sẽ giải phóng seat về pool trống.`
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await checkinLicenseSeatCmd({ seatId })
      showCommandResult(result, `Đã thu hồi seat "${seatLabel}".`)
      if (
        result &&
        typeof result === 'object' &&
        'ok' in result &&
        (result as { ok: boolean }).ok
      ) {
        router.refresh()
      }
    })
  }

  if (state === 'ASSIGNED') {
    return (
      <button
        type="button"
        onClick={handleCheckin}
        disabled={isPending}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition border border-amber-200 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="mr-1 animate-spin" />
            Đang thu hồi...
          </>
        ) : (
          <>
            <Undo2 size={14} className="mr-1" />
            Thu hồi
          </>
        )}
      </button>
    )
  }

  if (state === 'EXPIRED') {
    return (
      <span
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg border border-gray-200"
        title="Seat đã bị đánh dấu expired — không thể cấp phát lại"
      >
        <XCircle size={14} className="mr-1" />
        Expired
      </span>
    )
  }

  // AVAILABLE
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition border border-indigo-200"
      >
        <ShoppingCart size={14} className="mr-1" />
        Cấp Seat
      </button>
      <CheckoutSeatModal
        open={open}
        onClose={() => setOpen(false)}
        seatId={seatId}
        seatLabel={seatLabel}
        users={users}
        assets={assets}
      />
    </>
  )
}