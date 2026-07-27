'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { checkoutLicenseSeatCmd } from '@/app/actions/license'
import { useToast } from '@/components/Toast'
import { Loader2, Key, User, Monitor } from 'lucide-react'

interface CheckoutSeatModalProps {
  open: boolean
  onClose: () => void
  seatId: string
  seatLabel: string
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  assets: { id: string; assetTag: string; name: string }[]
}

type CheckoutTarget = 'USER' | 'ASSET'

export default function CheckoutSeatModal({
  open,
  onClose,
  seatId,
  seatLabel,
  users,
  assets,
}: CheckoutSeatModalProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  
  const [targetType, setTargetType] = useState<CheckoutTarget>('USER')
  const [targetUserId, setTargetUserId] = useState<string>('')
  const [targetAssetId, setTargetAssetId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTargetType('USER')
    setTargetUserId('')
    setTargetAssetId('')
    setNotes('')
  }

  function handleSubmit() {
    if (targetType === 'USER' && !targetUserId) {
      showCommandResult({
        ok: false,
        code: 'VALIDATION',
        message: 'Vui lòng chọn nhân viên.',
      })
      return
    }
    if (targetType === 'ASSET' && !targetAssetId) {
      showCommandResult({
        ok: false,
        code: 'VALIDATION',
        message: 'Vui lòng chọn thiết bị.',
      })
      return
    }

    startTransition(async () => {
      const result = await checkoutLicenseSeatCmd({
        seatId,
        targetUserId: targetType === 'USER' ? targetUserId : undefined,
        targetAssetId: targetType === 'ASSET' ? targetAssetId : undefined,
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
            Cấp 1 ghế (seat) của license. Mỗi seat chỉ gán cho 1 đối tượng tại 1 thời điểm.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 space-x-1 bg-slate-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => setTargetType('USER')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm font-medium rounded-lg transition-all ${
              targetType === 'USER'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-slate-200/50'
            }`}
          >
            <User size={16} />
            <span>Nhân viên</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetType('ASSET')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm font-medium rounded-lg transition-all ${
              targetType === 'ASSET'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-slate-200/50'
            }`}
          >
            <Monitor size={16} />
            <span>Thiết bị</span>
          </button>
        </div>

        {targetType === 'USER' && (
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
        )}

        {targetType === 'ASSET' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Thiết bị <span className="text-red-500">*</span>
            </label>
            <select
              value={targetAssetId}
              onChange={(e) => setTargetAssetId(e.target.value)}
              required
              disabled={isPending}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition disabled:opacity-50"
            >
              <option value="">-- Chọn thiết bị --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetTag} - {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

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