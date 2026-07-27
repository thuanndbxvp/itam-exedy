'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  /** Optional — mã lỗi từ CommandResult<T>.code (NOT_FOUND, INVALID_STATE, FORBIDDEN, ...). */
  code?: string
  durationMs?: number
}

interface ToastContextValue {
  toasts: ToastItem[]
  show: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
  /**
   * Helper render kết quả từ server action.
   * - ok=true   → success toast (nếu truyền successMessage).
   * - ok=false  → error toast với message + code.
   * - unknown  → no-op.
   */
  showCommandResult: (
    result: unknown,
    successMessage?: string
  ) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Pure predicate: kiểm tra 1 unknown có phải CommandResult ok=false không.
 * Tách ra để unit-test mà KHÔNG cần React Testing Library.
 */
export function isCommandError(
  result: unknown
): result is { ok: false; code: string; message: string } {
  return (
    !!result &&
    typeof result === 'object' &&
    'ok' in result &&
    (result as { ok: boolean }).ok === false &&
    typeof (result as { code?: unknown }).code === 'string' &&
    typeof (result as { message?: unknown }).message === 'string'
  )
}

/**
 * Pure predicate: kiểm tra 1 unknown có phải CommandResult ok=true không.
 */
export function isCommandSuccess(
  result: unknown
): result is { ok: true; data: unknown } {
  return (
    !!result &&
    typeof result === 'object' &&
    'ok' in result &&
    (result as { ok: boolean }).ok === true
  )
}

/**
 * Hook lấy toast API. PHẢI dùng trong `<ToastProvider>`.
 *
 * Ví dụ:
 *   const { showCommandResult } = useToast()
 *   const result = await checkoutAssetCmd({ ... })
 *   showCommandResult(result, 'Đã cấp phát thành công!')
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast phải dùng trong <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const duration = toast.durationMs ?? 5000
      setToasts((prev) => [...prev, { ...toast, id }])
      // Tự động clear sau `duration` ms — UX chuẩn (5 giây).
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const showCommandResult = useCallback(
    (result: unknown, successMessage?: string) => {
      if (
        result &&
        typeof result === 'object' &&
        'ok' in result
      ) {
        const r = result as { ok: boolean; code?: string; message?: string; data?: unknown }
        if (r.ok === true) {
          if (successMessage) show({ type: 'success', message: successMessage })
        } else if (r.ok === false) {
          show({
            type: 'error',
            message: r.message ?? 'Lỗi không xác định.',
            code: r.code,
          })
        }
      }
    },
    [show]
  )

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss, showCommandResult }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div
      className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItemView key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItemView({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const Icon =
    toast.type === 'success'
      ? CheckCircle
      : toast.type === 'error'
      ? AlertCircle
      : Info

  const colorClass =
    toast.type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : toast.type === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-blue-50 border-blue-200 text-blue-800'

  return (
    <div
      className={`flex items-start space-x-3 p-4 border rounded-xl shadow-lg backdrop-blur ${colorClass} pointer-events-auto animate-in fade-in slide-in-from-right-4 transition-all`}
      role="alert"
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {toast.code && (
          <p className="text-xs font-mono uppercase tracking-wider opacity-70 mb-1">
            {toast.code}
          </p>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-50 hover:opacity-100 transition flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}