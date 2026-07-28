'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, AlertCircle, Search } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

interface MyAssets {
  assets: Array<{
    id: string
    assetTag: string
    name: string
    modelName: string | null
    categoryName: string | null
  }>
  licenseSeats: Array<{
    id: string
    licenseId: string
    licenseName: string
    productKey: string | null
  }>
}

// C.6: IT roles có quyền tạo ticket cho bất kỳ asset nào
const IT_ROLES = ['ADMIN', 'IT_MANAGER', 'IT_STAFF']

const CATEGORY_OPTIONS = [
  { value: 'HARDWARE', label: 'Phần cứng (máy tính, màn hình…)' },
  { value: 'SOFTWARE', label: 'Phần mềm (license, app…)' },
  { value: 'NETWORK', label: 'Mạng (Wi-Fi, VPN, mất kết nối…)' },
  { value: 'ACCOUNT', label: 'Tài khoản (SSO, email, mật khẩu…)' },
  { value: 'OTHER', label: 'Khác' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Thấp — chờ được' },
  { value: 'MEDIUM', label: 'Trung bình — ảnh hưởng công việc' },
  { value: 'HIGH', label: 'Cao — không thể làm việc' },
  { value: 'URGENT', label: 'Khẩn cấp — nhiều người ảnh hưởng' },
]

const TYPE_OPTIONS = [
  { value: 'INCIDENT', label: 'Sự cố (có cái gì đó bị hỏng)' },
  { value: 'REQUEST', label: 'Yêu cầu (xin cấp/thay đổi)' },
]

export default function NewTicketPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [myData, setMyData] = useState<MyAssets | null>(null)

  // Mode: 'asset' = báo lỗi cho asset của tôi, 'other' = vấn đề khác
  const [mode, setMode] = useState<'asset' | 'other'>('other')
  const [reportedAssetId, setReportedAssetId] = useState('')
  const [type, setType] = useState<'INCIDENT' | 'REQUEST'>('INCIDENT')
  const [category, setCategory] = useState('OTHER')
  const [priority, setPriority] = useState('MEDIUM')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // C.6: IT Search Autocomplete state
  const [isIT, setIsIT] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MyAssets['assets']>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const searchRef = useRef<HTMLDivElement>(null)

  // C.6: Detect IT role from session
  useEffect(() => {
    if (session?.user?.role && IT_ROLES.includes(session.user.role)) {
      setIsIT(true)
    }
  }, [session])

  // C.6: Search assets when IT staff types
  useEffect(() => {
    if (!isIT || mode !== 'asset' || !debouncedSearch) {
      setSearchResults([])
      return
    }

    async function search() {
      setSearching(true)
      try {
        const r = await fetch(`/api/helpdesk/search-assets?q=${encodeURIComponent(debouncedSearch)}`)
        const json = await r.json()
        if (json.ok) {
          setSearchResults(json.data.assets)
          setShowDropdown(true)
        }
      } finally {
        setSearching(false)
      }
    }
    search()
  }, [isIT, mode, debouncedSearch])

  // C.6: Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // C.6: Select asset from dropdown
  function selectAsset(asset: MyAssets['assets'][0]) {
    setReportedAssetId(asset.id)
    setSelectedLabel(`${asset.assetTag} — ${asset.name}`)
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
  }

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch('/api/helpdesk/my-assets', { cache: 'no-store' })
        const json = await r.json()
        if (json.ok) setMyData(json.data)
      } finally {
        setLoadingAssets(false)
      }
    }
    load()
  }, [])

  // Auto-suggest category khi chọn asset
  useEffect(() => {
    if (mode === 'asset' && reportedAssetId) {
      const a = myData?.assets.find((x) => x.id === reportedAssetId)
      if (a?.categoryName) {
        const lower = a.categoryName.toLowerCase()
        if (lower.includes('license')) setCategory('SOFTWARE')
        else if (lower.includes('laptop') || lower.includes('desktop') || lower.includes('monitor') || lower.includes('phone') || lower.includes('printer')) {
          setCategory('HARDWARE')
        }
      }
    }
  }, [mode, reportedAssetId, myData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (title.trim().length < 5) {
      setError('Tiêu đề tối thiểu 5 ký tự.')
      return
    }
    if (description.trim().length < 10) {
      setError('Mô tả tối thiểu 10 ký tự.')
      return
    }

    setSubmitting(true)
    try {
      const r = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          category,
          priority,
          reportedAssetId: mode === 'asset' && reportedAssetId ? reportedAssetId : null,
        }),
      })
      const json = await r.json()
      if (!json.ok) {
        setError(json.message ?? 'Tạo ticket thất bại.')
        return
      }
      router.push(`/helpdesk/${json.data.ticket.code}`)
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) return null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href="/helpdesk"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} className="mr-1" />
        Quay lại danh sách
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Tạo ticket mới</h2>
      <p className="text-sm text-gray-500 mb-6">
        Báo lỗi hoặc yêu cầu hỗ trợ. IT sẽ nhận được thông báo ngay.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Mode selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bạn muốn báo gì?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('asset')}
              className={`p-4 rounded-lg border-2 text-left transition ${
                mode === 'asset'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">Tài sản của tôi</div>
              <div className="text-xs text-gray-500 mt-1">
                Chọn 1 asset bạn đang được giao để báo lỗi
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('other')}
              className={`p-4 rounded-lg border-2 text-left transition ${
                mode === 'other'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">Vấn đề khác</div>
              <div className="text-xs text-gray-500 mt-1">
                Mạng, tài khoản, hoặc sự cố chung
              </div>
            </button>
          </div>
        </div>

        {/* Asset picker */}
        {mode === 'asset' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tài sản gặp sự cố
            </label>
            {loadingAssets ? (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin mr-1" /> Đang tải danh sách tài sản…
              </div>
            ) : isIT ? (
              // C.6: IT Staff - Search autocomplete
              <div ref={searchRef} className="relative">
                {selectedLabel ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                      <span className="font-medium text-blue-700">{selectedLabel}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReportedAssetId('')
                          setSelectedLabel('')
                        }}
                        className="ml-2 text-xs text-blue-600 hover:underline"
                      >
                        Đổi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setReportedAssetId('')
                      }}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      placeholder="Tìm kiếm tài sản (VD: Dell, Server, Laptop...)"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {searching && (
                      <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                  </div>
                )}

                {/* Search dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white shadow-lg border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((asset) => (
                      <li key={asset.id}>
                        <button
                          type="button"
                          onClick={() => selectAsset(asset)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 transition text-sm"
                        >
                          <div className="font-medium text-gray-900">{asset.assetTag} — {asset.name}</div>
                          {asset.modelName && (
                            <div className="text-xs text-gray-500">{asset.modelName}</div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {showDropdown && searchQuery && searchResults.length === 0 && !searching && (
                  <div className="absolute z-10 w-full mt-1 bg-white shadow-lg border border-gray-200 rounded-lg p-3 text-sm text-gray-500">
                    Không tìm thấy tài sản nào.
                  </div>
                )}
              </div>
            ) : !myData || myData.assets.length === 0 ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Bạn hiện không có tài sản nào được giao. Hãy chọn "Vấn đề khác" hoặc liên hệ IT.
              </div>
            ) : (
              // Employee - Simple dropdown
              <select
                value={reportedAssetId}
                onChange={(e) => setReportedAssetId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">— Chọn tài sản —</option>
                {myData.assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} — {a.name}
                    {a.modelName ? ` (${a.modelName})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Type + Category + Priority */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'INCIDENT' | 'REQUEST')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Laptop không khởi động được"
            required
            minLength={5}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả rõ vấn đề bạn gặp phải. Khi nào bắt đầu? Đã thử gì? Có thông báo lỗi nào?"
            required
            minLength={10}
            rows={5}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">{description.length} ký tự</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/helpdesk"
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Tạo ticket
          </button>
        </div>
      </form>
    </div>
  )
}