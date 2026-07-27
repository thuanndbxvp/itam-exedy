'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'

interface FilterPanelProps {
  statuses: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  locations: { id: string; name: string }[]
}

export default function FilterPanel({ statuses, categories, locations }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    statusId: searchParams.get('statusId') ?? '',
    categoryId: searchParams.get('categoryId') ?? '',
    locationId: searchParams.get('locationId') ?? '',
    assigned: searchParams.get('assigned') ?? '',
    search: searchParams.get('search') ?? '',
  })

  function applyFilters() {
    const params = new URLSearchParams()
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.delete('page') // Reset to page 1 when filter changes
    const query = params.toString()
    router.push(`/assets${query ? '?' + query : ''}`)
    setIsOpen(false)
  }

  function clearFilters() {
    setLocalFilters({
      statusId: '',
      categoryId: '',
      locationId: '',
      assigned: '',
      search: '',
    })
    router.push('/assets')
    setIsOpen(false)
  }

  const activeFilterCount = Object.values(localFilters).filter(Boolean).length

  return (
    <div className="relative">
      <button
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

          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-xl border border-gray-200 w-80 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded transition">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                <input
                  type="text"
                  value={localFilters.search}
                  onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                  placeholder="assetTag, tên, serial..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={localFilters.statusId}
                  onChange={(e) => setLocalFilters({ ...localFilters, statusId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Tất cả</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  value={localFilters.categoryId}
                  onChange={(e) => setLocalFilters({ ...localFilters, categoryId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Tất cả</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                <select
                  value={localFilters.locationId}
                  onChange={(e) => setLocalFilters({ ...localFilters, locationId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Tất cả</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Assigned */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái gán</label>
                <select
                  value={localFilters.assigned}
                  onChange={(e) => setLocalFilters({ ...localFilters, assigned: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="assigned">Đã gán</option>
                  <option value="unassigned">Chưa gán</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
              >
                Xóa bộ lọc
              </button>
              <button
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
  )
}
