'use client'

import { Loader2 } from 'lucide-react'
import Modal from './Modal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Câu hỏi xác nhận. VD: "Bạn có chắc muốn xóa công ty này?" */
  message: string
  /** Label nút confirm. Mặc định: "Xóa". */
  confirmLabel?: string
  cancelLabel?: string
  /** Bật khi đang chạy mutation — disable cả 2 nút + spinner. */
  loading?: boolean
  /** Variant danger (đỏ) hay primary (xanh). Mặc định: danger. */
  variant?: 'danger' | 'primary'
  onConfirm: () => void
}

/**
 * Modal xác nhận hành động — dùng cho delete + các thao tác phá hoại.
 *
 * Phase 1: tối giản, không tuỳ chọn icon/tooltip. Phase 2 có thể bổ sung `description` slot.
 */
export default function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  loading = false,
  variant = 'danger',
  onConfirm,
}: ConfirmModalProps) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-600 hover:bg-blue-700'

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-xl flex items-center gap-2 disabled:opacity-70 ${confirmClass}`}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}