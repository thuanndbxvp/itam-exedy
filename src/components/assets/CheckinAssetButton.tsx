'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { checkinAssetCmd } from '@/app/actions/asset'
import { useToast } from '@/components/Toast'
import { Undo2, Loader2 } from 'lucide-react'

interface CheckinAssetButtonProps {
  assetId: string
  assetTag: string
}

/**
 * Nút "Thu hồi" — chỉ hiển thị khi asset đang được assign cho target nào đó.
 *
 * Confirm bằng `window.confirm` cho MVP — UX tốt hơn silent submit, không cần Modal.
 * Phase 2: có thể chuyển sang Modal confirm riêng.
 *
 * Phase 1: chỉ ADMIN (wrap trong <RoleGate>).
 * Server action `checkinAssetCmd` enforce `requireRole('ADMIN')` (Epic C+1).
 */
export default function CheckinAssetButton({
  assetId,
  assetTag,
}: CheckinAssetButtonProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (isPending) return
    const confirmed = window.confirm(
      `Thu hồi asset "${assetTag}" về kho? Hành động này sẽ giải phóng target hiện tại.`
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await checkinAssetCmd({ assetId })
      showCommandResult(result, `Đã thu hồi asset "${assetTag}" về kho.`)
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

  return (
    <button
      type="button"
      onClick={handleClick}
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