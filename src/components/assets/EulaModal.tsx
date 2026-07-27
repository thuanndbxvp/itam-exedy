'use client'

/**
 * EulaModal — Sprint C3.
 *
 * Modal hiển thị EULA text + checkbox đồng ý + 2 nút Đồng ý/Từ chối.
 * Nếu user đồng ý → gọi `acceptEulaCmd` → onAccept().
 * Nếu từ chối → onDecline().
 */

import { useState, useTransition } from 'react'
import { FileText, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { acceptEulaCmd } from '@/app/actions/eula'

interface Props {
  open: boolean
  categoryId: string
  categoryName: string
  eulaText: string
  onAccept: () => void
  onDecline: () => void
}

export default function EulaModal({
  open,
  categoryId,
  categoryName,
  eulaText,
  onAccept,
  onDecline,
}: Props) {
  const { showCommandResult } = useToast()
  const [checked, setChecked] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptEulaCmd({ categoryId })
      if (result.ok) {
        showCommandResult(result, 'Đã chấp nhận EULA.')
        onAccept()
      } else {
        showCommandResult(result)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <FileText size={20} className="text-amber-600" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">
              Điều khoản sử dụng (EULA)
            </h2>
            <p className="text-xs text-gray-500">{categoryName}</p>
          </div>
        </div>

        {/* Body — scrollable EULA text */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg mb-4 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              Trước khi checkout asset thuộc danh mục này, bạn cần đọc và đồng ý với điều khoản.
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {eulaText}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="rounded text-blue-600"
            />
            Tôi đã đọc và đồng ý với điều khoản trên.
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onDecline}
              disabled={isPending}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Từ chối
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={isPending || !checked}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Đồng ý & tiếp tục
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
