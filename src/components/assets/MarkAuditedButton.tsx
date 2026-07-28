'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/ui/Modal'

interface Props {
  assetId: string
  hasNextAudit?: boolean
}

/**
 * MarkAuditedButton — nút "Đánh dấu đã kiểm kê" ở asset detail page.
 *
 * - Click → POST /api/assets/[id]/audit
 * - Thành công → toast + router.refresh() để cập nhật lastAuditDate/nextAuditDate
 * - Confirm dialog nếu nextAuditDate chưa đến hạn (optional nice-to-have)
 */
export default function MarkAuditedButton({ assetId }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleConfirm() {
    setConfirmOpen(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/assets/${assetId}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium disabled:opacity-50"
        title="Đánh dấu đã kiểm kê (lastAuditDate = hôm nay)"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        Đánh dấu đã kiểm kê
      </button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận kiểm kê"
      >
        <p className="text-gray-600 mb-4">
          Đánh dấu tài sản này đã được kiểm kê hôm nay?
        </p>
        <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
          <li>lastAuditDate = hôm nay</li>
          <li>nextAuditDate = hôm nay + 365 ngày</li>
        </ul>
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
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
          >
            Xác nhận
          </button>
        </div>
      </Modal>
    </>
  )
}
