'use client'

/**
 * FilterPanel — C5 + C6.
 *
 * Mở rộng từ FilterPanel Sprint F với:
 *  - C6: thêm các field advanced (model, supplier, date ranges, warranty, EOL, BYOD, requestable).
 *  - C5: dropdown list saved filters (own + public) + nút "Lưu bộ lọc hiện tại".
 *
 * URLSearchParams-first persistence: tất cả filter state nằm trên URL.
 * Saved filter loads = apply JSON → set URL params.
 */
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, Bookmark, Save, ChevronDown, Trash2 } from 'lucide-react'

interface FilterOption {
  id: string
  name: string
}

interface SavedFilterItem {
  id: string
  name: string
  scope: string
  filters: Record<string, unknown>
  isPublic: boolean
  isOwner: boolean
  ownerName: string
}

interface FilterPanelProps {
  statuses: FilterOption[]
  categories: FilterOption[]
  locations: FilterOption[]
  models: FilterOption[]
  suppliers: FilterOption[]
  /** 'asset' (default) — Phase 2 sẽ mở rộng license/user. */
  scope?: 'ASSET'
}

const FILTER_KEYS = [
  'search',
  'statusId',
  'categoryId',
  'locationId',
  'assigned',
  'modelId',
  'supplierId',
  'purchaseDateFrom',
  'purchaseDateTo',
  'warrantyMonthsMin',
  'warrantyMonthsMax',
  'eolDateFrom',
  'eolDateTo',
  'byod',
  'requestable',
] as const

export default function FilterPanel({
  statuses,
  categories,
  locations,
  models,
  suppliers,
  scope = 'ASSET',
}: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialFilters = FILTER_KEYS.reduce(
    (acc, key) => {
      acc[key] = searchParams.get(key) ?? ''
      return acc
    },
    {} as Record<string, string>
  )
  const [localFilters, setLocalFilters] = useState(initialFilters)
  const [isOpen, setIsOpen] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SavedFilterItem[]>([])
  const [savedOpen, setSavedOpen] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveAsPublic, setSaveAsPublic] = useState(false)

  // Reload initial filters khi URL thay đổi (e.g., user applied saved filter)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const newFilters = FILTER_KEYS.reduce(
      (acc, key) => {
        acc[key] = searchParams.get(key) ?? ''
        return acc
      },
      {} as Record<string, string>
    )
    setLocalFilters(newFilters)
  }, [searchParams])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load saved filters khi mở dropdown
  async function loadSavedFilters() {
    try {
      const res = await fetch(`/api/saved-filters?scope=${scope}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) setSavedFilters(json.data.filters)
    } catch {
      // ignore
    }
  }

  function applyFilters() {
    const params = new URLSearchParams()
    for (const key of FILTER_KEYS) {
      const val = localFilters[key]
      if (val) params.set(key, val)
    }
    params.delete('page')
    const query = params.toString()
    router.push(`/assets${query ? '?' + query : ''}`)
    setIsOpen(false)
  }

  function clearFilters() {
    setLocalFilters(
      FILTER_KEYS.reduce((acc, key) => {
        acc[key] = ''
        return acc
      }, {} as Record<string, string>)
    )
    router.push('/assets')
    setIsOpen(false)
  }

  function applySaved(f: SavedFilterItem) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(f.filters)) {
      if (v !== null && v !== undefined && v !== '') {
        params.set(k, String(v))
      }
    }
    params.delete('page')
    router.push(`/assets${params.toString() ? '?' + params.toString() : ''}`)
    setSavedOpen(false)
    setIsOpen(false)
  }

  async function saveCurrent() {
    if (!saveName.trim()) return
    const filtersObj: Record<string, string> = {}
    for (const key of FILTER_KEYS) {
      if (localFilters[key]) filtersObj[key] = localFilters[key]
    }
    try {
      const res = await fetch('/api/saved-filters', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          scope,
          filters: filtersObj,
          isPublic: saveAsPublic,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setSaveModalOpen(false)
        setSaveName('')
        setSaveAsPublic(false)
        await loadSavedFilters()
      } else {
        alert(json.message ?? 'Lỗi khi lưu.')
      }
    } catch {
      alert('Lỗi kết nối.')
    }
  }

  async function deleteSaved(id: string) {
    if (!confirm('Xóa bộ lọc đã lưu này?')) return
    try {
      const res = await fetch(`/api/saved-filters/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) {
        setSavedFilters((prev) => prev.filter((f) => f.id !== id))
      }
    } catch {
      // ignore
    }
  }

  const activeFilterCount = Object.values(localFilters).filter(Boolean).length

  function setField(key: string, value: string) {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* C5: Saved filters dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setSavedOpen(!savedOpen)
            if (!savedOpen) loadSavedFilters()
          }}
          className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-700"
        >
          <Bookmark size={14} /> Bộ lọc đã lưu <ChevronDown size={12} />
        </button>
        {savedOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setSavedOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-xl border border-gray-200 w-72 p-2 max-h-96 overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase">
                Bộ lọc của tôi & công khai
              </div>
              {savedFilters.length === 0 ? (
                <p className="px-2 py-4 text-xs text-gray-400 text-center">
                  Chưa có bộ lọc nào.
                </p>
              ) : (
                savedFilters.map((f) => (
                  <div
                    key={f.id}
                    className="group flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded"
                  >
                    <button
                      type="button"
                      onClick={() => applySaved(f)}
                      className="flex-1 text-left text-sm"
                    >
                      <div className="font-medium text-gray-900">{f.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {f.isPublic ? 'Công khai' : 'Riêng tư'} · {f.ownerName}
                      </div>
                    </button>
                    {f.isOwner && (
                      <button
                        type="button"
                        onClick={() => deleteSaved(f.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Filter button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition ${
            activeFilterCount > 0
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Filter size={16} />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

            <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-xl border border-gray-200 w-96 max-h-[80vh] overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Bộ lọc nâng cao</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tìm kiếm
                  </label>
                  <input
                    type="text"
                    value={localFilters.search}
                    onChange={(e) => setField('search', e.target.value)}
                    placeholder="assetTag, tên, serial..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={localFilters.statusId}
                      onChange={(e) => setField('statusId', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Tất cả</option>
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Danh mục
                    </label>
                    <select
                      value={localFilters.categoryId}
                      onChange={(e) => setField('categoryId', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Tất cả</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vị trí
                    </label>
                    <select
                      value={localFilters.locationId}
                      onChange={(e) => setField('locationId', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Tất cả</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gán
                    </label>
                    <select
                      value={localFilters.assigned}
                      onChange={(e) => setField('assigned', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Tất cả</option>
                      <option value="assigned">Đã gán</option>
                      <option value="unassigned">Chưa gán</option>
                    </select>
                  </div>

                  {/* C6: Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <select
                      value={localFilters.modelId}
                      onChange={(e) => setField('modelId', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Tất cả</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* C6: Supplier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhà cung cấp
                    </label>
                    <select
                      value={localFilters.supplierId}
                      onChange={(e) => setField('supplierId', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Tất cả</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* C6: Date ranges */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase">
                    Khoảng thời gian
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày mua (từ → đến)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={localFilters.purchaseDateFrom}
                        onChange={(e) => setField('purchaseDateFrom', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={localFilters.purchaseDateTo}
                        onChange={(e) => setField('purchaseDateTo', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày EOL (từ → đến)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={localFilters.eolDateFrom}
                        onChange={(e) => setField('eolDateFrom', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={localFilters.eolDateTo}
                        onChange={(e) => setField('eolDateTo', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bảo hành (tháng, từ → đến)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        value={localFilters.warrantyMonthsMin}
                        onChange={(e) => setField('warrantyMonthsMin', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="min"
                      />
                      <input
                        type="number"
                        min="0"
                        value={localFilters.warrantyMonthsMax}
                        onChange={(e) => setField('warrantyMonthsMax', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="max"
                      />
                    </div>
                  </div>
                </div>

                {/* C6: Booleans */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.byod === 'true'}
                      onChange={(e) => setField('byod', e.target.checked ? 'true' : '')}
                      className="rounded text-blue-600"
                    />
                    BYOD (Bring Your Own Device)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.requestable === 'true'}
                      onChange={(e) =>
                        setField('requestable', e.target.checked ? 'true' : '')
                      }
                      className="rounded text-blue-600"
                    />
                    Cho phép user yêu cầu (requestable)
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
                >
                  Xóa bộ lọc
                </button>
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(true)}
                  className="px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-medium transition"
                  disabled={activeFilterCount === 0}
                  title={
                    activeFilterCount === 0
                      ? 'Hãy áp dụng ít nhất 1 filter trước khi lưu'
                      : 'Lưu bộ lọc hiện tại'
                  }
                >
                  <Save size={14} className="inline mr-1" />
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Lưu bộ lọc hiện tại</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Tên bộ lọc (vd: Laptop Dell cũ)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
              autoFocus
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
              <input
                type="checkbox"
                checked={saveAsPublic}
                onChange={(e) => setSaveAsPublic(e.target.checked)}
                className="rounded text-blue-600"
              />
              Chia sẻ công khai (mọi người dùng được)
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveCurrent}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
