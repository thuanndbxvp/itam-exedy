'use client'

import { useState } from 'react'
import { checkinAssetCmd } from '@/app/actions/asset'
import { useToast } from '@/components/Toast'
import { Undo2, Loader2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'

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
 * Server action `checkinAssetCmd` enforce `requirePermission('assets.checkin')`.
 */
export default function CheckinAssetButton({
  assetId,
  assetTag,
}: CheckinAssetButtonProps) {
  const { showCommandResult } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  function handleClick() {
    if (isPending) return
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    setConfirmOpen(false)
    setIsPending(true)
    try {
      const result = await checkinAssetCmd({ assetId })
      showCommandResult(result, `Đã thu hồi asset "${assetTag}" về kho.`)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition border border-amber-200 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="mr-1 animate-spin" />
            Đang thu hôi...
          </>
        ) : (
          <>
            <Undo2 size={14} className="mr-1" />
            Thu hồi
          </>
        )}
      </button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận thu hồi"
      >
        <p className="text-gray-600 mb-4">
          Thu hồi asset <strong>"{assetTag}"</strong> về kho? Hành động này sẽ giải phóng target hiện tại.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
          >
            Thu hồi
          </button>
        </div>
      </Modal>
    </>
  )
}