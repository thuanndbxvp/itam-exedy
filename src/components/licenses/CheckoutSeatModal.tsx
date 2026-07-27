'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { checkoutLicenseSeatCmd } from '@/app/actions/license'
import { useToast } from '@/components/Toast'
import { Loader2, Key } from 'lucide-react'

interface CheckoutSeatModalProps {
  open: boolean
  onClose: () => void
  seatId: string
  seatLabel: string
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
}

/**
 * Modal cấp 1 LicenseSeat cho User.
 * Phase 1: chỉ cho checkout cho User (không hỗ trợ cấp cho Asset).
 * Phase 2: thêm targetType=ASSET nếu cần.
 */
export default function CheckoutSeatModal({
  open,
  onClose,
  seatId,
  seatLabel,
  users,
}: CheckoutSeatModalProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [targetUserId, setTargetUserId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTargetUserId('')
    setNotes('')
  }

  function handleSubmit() {
    if (!targetUserId) {
      showCommandResult({
        ok: false,
        code: 'VALIDATION',
        message: 'Vui lòng chọn nhân viên.',
      })
      return
    }
    startTransition(async () => {
      const result = await checkoutLicenseSeatCmd({
        seatId,
        targetUserId,
        notes: notes.trim() || undefined,
      })
      showCommandResult(result, `Đã cấp seat "${seatLabel}" thành công!`)
      if (
        result &&
        typeof result === 'object' &&
        'ok' in result &&
        (result as { ok: boolean }).ok
      ) {
        reset()
        onClose()
        router.refresh()
      }
    })
  }

  function handleClose() {
    if (isPending) return
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Cấp License Seat "${seatLabel}"`}
      size="md"
    >
      <div className="space-y-5">
        <div className="flex items-start space-x-2 bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-xl">
          <Key size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            Cấp 1 ghế (seat) của license cho nhân viên. Mỗi seat chỉ gán cho 1 user tại 1 thời điểm.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nhân viên <span className="text-red-500">*</span>
          </label>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            required
            disabled={isPending}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition disabled:opacity-50"
          >
            <option value="">-- Chọn nhân viên --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName}
                {u.lastName ? ' ' + u.lastName : ''}{' '}
                {u.email ? `(${u.email})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ghi chú
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            disabled={isPending}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition resize-none disabled:opacity-50"
            placeholder="Lý do cấp phát, dự án, v.v."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Đang cấp...
              </>
            ) : (
              'Xác nhận cấp seat'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}