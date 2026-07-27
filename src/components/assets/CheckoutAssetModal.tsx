'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import {
  checkoutAssetCmd,
  checkoutAssetToLocationCmd,
  checkoutAssetToAssetCmd,
} from '@/app/actions/asset'
import { useToast } from '@/components/Toast'
import { User, MapPin, Loader2, MonitorSmartphone } from 'lucide-react'
import EulaModal from './EulaModal'

interface CheckoutAssetModalProps {
  open: boolean
  onClose: () => void
  assetId: string
  assetTag: string
  /** Phase 1: Server Component (assets/page.tsx) load sẵn + truyền xuống để tránh fetch từ client. */
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  locations: { id: string; name: string }[]
  /** B7: list thiết bị có thể gán vào (đã filter sẵn ở server). */
  assets: { id: string; assetTag: string; name: string }[]
}

type TargetType = 'USER' | 'LOCATION' | 'ASSET'

interface EulaGate {
  categoryId: string
  categoryName: string
  eulaText: string
  alreadyAccepted: boolean
}

export default function CheckoutAssetModal({
  open,
  onClose,
  assetId,
  assetTag,
  users,
  locations,
  assets,
}: CheckoutAssetModalProps) {  const router = useRouter()
  const { showCommandResult } = useToast()
  const [targetType, setTargetType] = useState<TargetType>('USER')
  const [targetUserId, setTargetUserId] = useState<string>('')
  const [targetLocationId, setTargetLocationId] = useState<string>('')
  const [targetAssetId, setTargetAssetId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [expectedCheckin, setExpectedCheckin] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  // C3: EULA gate state
  const [eulaGate, setEulaGate] = useState<EulaGate | null>(null)
  const [eulaOpen, setEulaOpen] = useState(false)
  const [eulaChecked, setEulaChecked] = useState(false)

  function reset() {
    setTargetUserId('')
    setTargetLocationId('')
    setTargetAssetId('')
    setNotes('')
    setExpectedCheckin('')
    setTargetType('USER')
    setEulaChecked(false)
  }

  // C3: Khi mở modal → fetch EULA gate status cho asset này
  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/assets/${assetId}/eula-gate`, { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (json.ok && json.data.requireAcceptance && !json.data.alreadyAccepted) {
          setEulaGate({
            categoryId: json.data.categoryId,
            categoryName: json.data.categoryName,
            eulaText: json.data.eulaText,
            alreadyAccepted: false,
          })
          setEulaOpen(true)
        } else {
          setEulaGate(null)
          setEulaOpen(false)
        }
      } catch {
        if (!cancelled) {
          setEulaGate(null)
          setEulaOpen(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, assetId])

  function handleSubmit() {
    // C3: nếu EULA gate đang mở → block submit (force user qua modal trước)
    if (eulaGate && !eulaChecked) {
      setEulaOpen(true)
      return
    }
    startTransition(async () => {
      let result: unknown
      if (targetType === 'USER') {
        if (!targetUserId) {
          showCommandResult({
            ok: false,
            code: 'VALIDATION',
            message: 'Vui lòng chọn nhân viên.',
          })
          return
        }
        result = await checkoutAssetCmd({
          assetId,
          targetUserId,
          notes: notes.trim() || undefined,
          expectedCheckin: expectedCheckin || undefined,
        })
      } else if (targetType === 'LOCATION') {
        if (!targetLocationId) {
          showCommandResult({
            ok: false,
            code: 'VALIDATION',
            message: 'Vui lòng chọn vị trí.',
          })
          return
        }
        result = await checkoutAssetToLocationCmd({
          assetId,
          targetLocationId,
          notes: notes.trim() || undefined,
        })
      } else {
        // ASSET
        if (!targetAssetId) {
          showCommandResult({
            ok: false,
            code: 'VALIDATION',
            message: 'Vui lòng chọn thiết bị.',
          })
          return
        }
        result = await checkoutAssetToAssetCmd({
          assetId,
          targetAssetId,
          notes: notes.trim() || undefined,
          expectedCheckin: expectedCheckin || undefined,
        })
      }
      showCommandResult(result, `Đã cấp phát asset "${assetTag}" thành công!`)
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
    <>
      <Modal
        open={open}
      onClose={handleClose}
      title={`Cấp phát asset "${assetTag}"`}
      size="md"
    >
      <div className="space-y-5">
        {/* Target Type toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cấp phát cho
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTargetType('USER')}
              disabled={isPending}
              className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-xl transition ${
                targetType === 'USER'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              } disabled:opacity-50`}
            >
              <User size={18} />
              <span className="font-medium text-sm">Nhân viên</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('LOCATION')}
              disabled={isPending}
              className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-xl transition ${
                targetType === 'LOCATION'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              } disabled:opacity-50`}
            >
              <MapPin size={18} />
              <span className="font-medium text-sm">Vị trí</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('ASSET')}
              disabled={isPending}
              className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-xl transition ${
                targetType === 'ASSET'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              } disabled:opacity-50`}
              title="Gán cho thiết bị khác (vd: chuột gán cho laptop)"
            >
              <MonitorSmartphone size={18} />
              <span className="font-medium text-sm">Thiết bị</span>
            </button>
          </div>
        </div>

        {/* Target select */}
        {targetType === 'USER' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nhân viên <span className="text-red-500">*</span>
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              required
              disabled={isPending}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
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
        ) : targetType === 'LOCATION' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Vị trí <span className="text-red-500">*</span>
            </label>
            <select
              value={targetLocationId}
              onChange={(e) => setTargetLocationId(e.target.value)}
              required
              disabled={isPending}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
            >
              <option value="">-- Chọn vị trí --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Thiết bị đích <span className="text-red-500">*</span>
            </label>
            <select
              value={targetAssetId}
              onChange={(e) => setTargetAssetId(e.target.value)}
              required
              disabled={isPending}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
            >
              <option value="">-- Chọn thiết bị --</option>
              {assets.length === 0 ? (
                <option value="" disabled>
                  Không có thiết bị khả thi (tất cả đều đã được gán hoặc không deployable)
                </option>
              ) : (
                assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} — {a.name}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Ví dụ: gán chuột / dock cho laptop.
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ghi chú
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            disabled={isPending}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-none disabled:opacity-50"
            placeholder="Lý do cấp phát, dự án, v.v."
          />
        </div>

        {/* Expected checkin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ngày dự kiến thu hồi (tùy chọn)
          </label>
          <input
            type="date"
            value={expectedCheckin}
            onChange={(e) => setExpectedCheckin(e.target.value)}
            disabled={isPending}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
          />
        </div>

        {/* Actions */}
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
            className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Đang cấp phát...
              </>
            ) : (
              'Xác nhận cấp phát'
            )}
          </button>
        </div>
      </div>
    </Modal>

    {/* C3: EULA gate (chỉ render nếu asset.category requireAcceptance + user chưa accept) */}
    {eulaGate && (
      <EulaModal
        open={eulaOpen}
        categoryId={eulaGate.categoryId}
        categoryName={eulaGate.categoryName}
        eulaText={eulaGate.eulaText}
        onAccept={() => {
          setEulaChecked(true)
          setEulaOpen(false)
        }}
        onDecline={() => {
          setEulaOpen(false)
          showCommandResult({
            ok: false,
            code: 'EULA_DECLINED',
            message: 'Bạn cần đồng ý EULA để checkout asset này.',
          })
        }}
      />
    )}
    </>
  )
}