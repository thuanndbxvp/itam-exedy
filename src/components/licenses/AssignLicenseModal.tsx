'use client'

/**
 * AssignLicenseModal — Sprint A.5
 *
 * Compound modal (2-step wizard):
 *   1. Pick license (from list of available licenses)
 *   2. Pick free seat (fetch /api/licenses/[id]/seats?available=true)
 *   3. Confirm → POST /api/licenses/checkout-seat with targetAssetId
 *
 * Used from AssetDetailClient khi Admin bam nut "+ Gán bản quyền".
 */

import { useEffect, useState } from 'react'
import { Loader2, Key, Search } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { useRouter } from 'next/navigation'

interface License {
  id: string
  name: string
  productKey: string | null
  expirationDate: string | null
  availableSeats: number
  totalSeats: number
}

interface Seat {
  id: string
  notes: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  assetId: string
  assetTag: string
}

type Step = 'pickLicense' | 'pickSeat' | 'confirm'

export default function AssignLicenseModal({ open, onClose, assetId, assetTag }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [step, setStep] = useState<Step>('pickLicense')
  const [licenses, setLicenses] = useState<License[]>([])
  const [loadingLicenses, setLoadingLicenses] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [selectedSeatId, setSelectedSeatId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load licenses list with available seat count
  useEffect(() => {
    if (!open || licenses.length > 0) return
    setLoadingLicenses(true)
    fetch('/api/licenses/with-availability?limit=200', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setLicenses(j.data.licenses)
        else
          showCommandResult({
            ok: false,
            code: 'LOAD',
            message: j?.message ?? 'Không thể tải danh sách license.',
          })
        setLoadingLicenses(false)
      })
      .catch((e) => {
        console.error(e)
        setLoadingLicenses(false)
      })
  }, [open, licenses.length, showCommandResult])

  // Load available seats when license selected
  useEffect(() => {
    if (!selectedLicense) return
    setLoadingSeats(true)
    setSelectedSeatId('')
    fetch(`/api/licenses/${selectedLicense.id}/seats?available=true`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setSeats(j.data.seats)
        else
          showCommandResult({
            ok: false,
            code: 'LOAD',
            message: j?.message ?? 'Không thể tải danh sách seat trống.',
          })
        setLoadingSeats(false)
      })
      .catch((e) => {
        console.error(e)
        setLoadingSeats(false)
      })
  }, [selectedLicense, showCommandResult])

  function reset() {
    setStep('pickLicense')
    setSelectedLicense(null)
    setSelectedSeatId('')
    setSeats([])
    setSearchTerm('')
    setSubmitting(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleConfirm() {
    if (!selectedLicense || !selectedSeatId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/licenses/checkout-seat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ seatId: selectedSeatId, targetAssetId: assetId }),
      })
      const json = await res.json()
      showCommandResult(json)
      if (json.ok) {
        // Reload property data + close
        router.refresh()
        handleClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredLicenses = licenses.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.productKey?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const hasAvailableSeats = seats.length > 0

  return (
    <Modal open={open} onClose={handleClose} title={`Gán bản quyền cho thiết bị ${assetTag}`} size="lg">
      {/* Stepper */}
      <div className="mb-4 flex items-center gap-2 text-xs">
        <StepDot active={step === 'pickLicense'} done={!!selectedLicense} n={1} label="Chọn license" />
        <div className="flex-1 h-px bg-gray-200" />
        <StepDot active={step === 'pickSeat'} done={!!selectedSeatId} n={2} label="Chọn seat trống" />
        <div className="flex-1 h-px bg-gray-200" />
        <StepDot active={step === 'confirm'} done={false} n={3} label="Xác nhận" />
      </div>

      {step === 'pickLicense' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Tìm license theo tên hoặc product key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {loadingLicenses ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <Loader2 className="inline animate-spin mr-2" size={16} />
                Đang tải...
              </div>
            ) : filteredLicenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {licenses.length === 0 ? 'Chưa có license nào.' : 'Không tìm thấy license phù hợp.'}
              </div>
            ) : (
              filteredLicenses.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    if (l.availableSeats > 0) {
                      setSelectedLicense(l)
                      setStep('pickSeat')
                    }
                  }}
                  disabled={l.availableSeats === 0}
                  className="w-full p-3 text-left hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{l.name}</div>
                      {l.productKey && (
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {l.productKey.length > 8 ? `••••${l.productKey.slice(-4)}` : l.productKey}
                        </div>
                      )}
                    </div>
                    <div className="text-xs shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-medium ${
                          l.availableSeats > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {l.availableSeats}/{l.totalSeats} trống
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {step === 'pickSeat' && selectedLicense && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
            <div className="text-gray-600">Đang gán license</div>
            <div className="font-semibold text-gray-900">{selectedLicense.name}</div>
            <button
              onClick={() => {
                setStep('pickLicense')
                setSelectedSeatId('')
                setSeats([])
              }}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              ← Đổi license khác
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Chọn seat trống ({seats.length} có sẵn)
            </label>
            {loadingSeats ? (
              <div className="p-8 text-center text-sm text-gray-500 border border-gray-200 rounded-lg">
                <Loader2 className="inline animate-spin mr-2" size={16} />
                Đang tải...
              </div>
            ) : !hasAvailableSeats ? (
              <div className="p-8 text-center text-sm text-gray-500 border border-gray-200 rounded-lg">
                License này không còn seat trống.
              </div>
            ) : (
              <select
                value={selectedSeatId}
                onChange={(e) => {
                  setSelectedSeatId(e.target.value)
                  setStep('confirm')
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">— Chọn seat —</option>
                {seats.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    Seat #{idx + 1} {s.notes ? `(${s.notes})` : ''}
                    {' — '}
                    {s.id.slice(-6)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {step === 'confirm' && selectedLicense && selectedSeatId && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-amber-700" />
              <span className="font-semibold text-gray-900">Xác nhận cấp phát</span>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs mt-3">
              <dt className="text-gray-500">Thiết bị:</dt>
              <dd className="font-medium text-gray-900">{assetTag}</dd>
              <dt className="text-gray-500">License:</dt>
              <dd className="font-medium text-gray-900">{selectedLicense.name}</dd>
              <dt className="text-gray-500">Product Key:</dt>
              <dd className="font-mono text-gray-900">{selectedLicense.productKey || '—'}</dd>
              <dt className="text-gray-500">Seat ID:</dt>
              <dd className="font-mono text-gray-900">•••{selectedSeatId.slice(-6)}</dd>
            </dl>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setStep('pickSeat')}
              disabled={submitting}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
            >
              Quay lại
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Xác nhận gán
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function StepDot({ active, done, n, label }: { active: boolean; done: boolean; n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          active
            ? 'bg-blue-600 text-white'
            : done
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 text-gray-500'
        }`}
      >
        {done ? '✓' : n}
      </div>
      <span className={active ? 'text-blue-700 font-medium' : 'text-gray-500'}>{label}</span>
    </div>
  )
}
