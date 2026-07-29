'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { bulkCheckoutAction, bulkCheckinAction } from '@/app/actions/bulk-asset'
import { Loader2, Package, RotateCcw, Printer } from 'lucide-react'

interface BulkActionBarProps {
  selectedIds: string[]
  users: { id: string; firstName: string; lastName: string | null }[]
  onClearSelection: () => void
}

export default function BulkActionBar({
  selectedIds,
  users,
  onClearSelection,
}: BulkActionBarProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [targetUserId, setTargetUserId] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, setIsPending] = useState(false)

  if (selectedIds.length === 0) return null

  async function handleBulkCheckout() {
    if (!targetUserId) {
      showCommandResult({
        ok: false,
        code: 'VALIDATION',
        message: 'Vui lòng chọn nhân viên nhận tài sản.',
      })
      return
    }

    setIsPending(true)
    try {
      const result = await bulkCheckoutAction({
        assetIds: selectedIds,
        targetUserId,
        notes: notes.trim() || undefined,
      })

      if (result.ok) {
        const { success, failed } = result.data!
        showCommandResult(
          result,
          `Đã cấp phát ${success}/${selectedIds.length} tài sản.${failed > 0 ? ` ${failed} thất bại.` : ''}`
        )
        setShowCheckoutModal(false)
        setTargetUserId('')
        setNotes('')
        onClearSelection()
        router.refresh()
      } else {
        showCommandResult(result)
      }
    } finally {
      setIsPending(false)
    }
  }

  async function handleBulkCheckin() {
    setIsPending(true)
    try {
      const result = await bulkCheckinAction({
        assetIds: selectedIds,
        notes: notes.trim() || undefined,
      })

      if (result.ok) {
        const { success, failed } = result.data!
        showCommandResult(
          result,
          `Đã thu hồi ${success}/${selectedIds.length} tài sản.${failed > 0 ? ` ${failed} thất bại.` : ''}`
        )
        setShowCheckinModal(false)
        setNotes('')
        onClearSelection()
        router.refresh()
      } else {
        showCommandResult(result)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.length} tài sản được chọn
          </span>

          <div className="h-6 w-px bg-gray-200" />

          <button
            onClick={() => setShowCheckoutModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
          >
            <Package size={16} />
            Cấp phát hàng loạt
          </button>

          <button
            onClick={() => setShowCheckinModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            <RotateCcw size={16} />
            Thu hồi hàng loạt
          </button>

          <button
            onClick={onClearSelection}
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      {/* Bulk Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCheckoutModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Cấp phát hàng loạt ({selectedIds.length} tài sản)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nhân viên nhận tài sản <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName}
                      {u.lastName ? ' ' + u.lastName : ''}
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Lý do cấp phát hàng loạt..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCheckoutModal(false); setTargetUserId(''); setNotes('') }}
                disabled={isPending}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkCheckout}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-70"
              >
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
                ) : (
                  'Xác nhận cấp phát'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Checkin Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCheckinModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Thu hồi hàng loạt ({selectedIds.length} tài sản)
            </h2>

            <p className="text-gray-600 mb-4">
              Bạn có chắc muốn thu hồi {selectedIds.length} tài sản? Hành động này không thể hoàn tác.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Lý do thu hồi..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCheckinModal(false); setNotes('') }}
                disabled={isPending}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkCheckin}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-70"
              >
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
                ) : (
                  'Xác nhận thu hồi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
