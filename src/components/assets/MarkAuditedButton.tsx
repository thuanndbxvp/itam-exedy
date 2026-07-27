'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'

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

  async function handleClick() {
    if (!confirm('Đánh dấu tài sản này đã được kiểm kê hôm nay?\n\n• lastAuditDate = hôm nay\n• nextAuditDate = hôm nay + 365 ngày')) return
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
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium disabled:opacity-50"
      title="Đánh dấu đã kiểm kê (lastAuditDate = hôm nay)"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
      Đánh dấu đã kiểm kê
    </button>
  )
}
