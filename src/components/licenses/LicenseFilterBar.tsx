'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, FormEvent, KeyboardEvent } from 'react'
import { Search, Filter, X } from 'lucide-react'

export type LicenseStatusFilter = 'all' | 'active' | 'expiring_soon' | 'expired' | 'terminated'

const STATUS_OPTIONS: ReadonlyArray<{ value: LicenseStatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'expiring_soon', label: 'Sắp hết hạn (30 ngày)' },
  { value: 'expired', label: 'Đã hết hạn' },
  { value: 'terminated', label: 'Đã thanh lý' },
]

interface LicenseFilterBarProps {
  initialSearch: string
  initialStatus: LicenseStatusFilter
}

export default function LicenseFilterBar({ initialSearch, initialStatus }: LicenseFilterBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState<string>(initialSearch)
  const [status, setStatus] = useState<LicenseStatusFilter>(initialStatus)
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false)

  const hasActiveFilter = search.length > 0 || status !== 'all'

  function pushToUrl(nextSearch: string, nextStatus: LicenseStatusFilter) {
    const sp = new URLSearchParams()
    if (nextSearch) sp.set('search', nextSearch)
    if (nextStatus && nextStatus !== 'all') sp.set('status', nextStatus)
    const qs = sp.toString()
    startTransition(() => {
      router.replace(qs ? `/licenses?${qs}` : '/licenses')
    })
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    pushToUrl(search.trim(), status)
  }

  function handleStatusChange(next: LicenseStatusFilter) {
    setStatus(next)
    pushToUrl(search.trim(), next)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setSearch('')
      pushToUrl('', status)
    }
  }

  function handleClearAll() {
    setSearch('')
    setStatus('all')
    startTransition(() => {
      router.replace('/licenses')
    })
  }

  return (
    <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
      <form onSubmit={handleSubmit} className="relative flex-1 sm:max-w-md flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm tên phần mềm, Product Key..."
            className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition"
            disabled={isPending}
            aria-label="Tìm license theo tên"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                pushToUrl('', status)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Xóa từ khóa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="ml-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition disabled:opacity-50"
          disabled={isPending}
        >
          Tìm
        </button>
      </form>

      <div className="relative">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className={`p-2 border rounded-xl shadow-sm transition ${
            status !== 'all'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
          }`}
          aria-label="Bộ lọc nâng cao"
          aria-expanded={advancedOpen}
        >
          <Filter className="w-5 h-5" />
        </button>
        {advancedOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setAdvancedOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                Trạng thái
              </p>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    handleStatusChange(opt.value)
                    setAdvancedOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    status === opt.value
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearAll()
                    setAdvancedOpen(false)
                  }}
                  className="w-full mt-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 transition"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
