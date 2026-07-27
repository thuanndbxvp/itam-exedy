# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC J — ADVANCED SEARCH & FILTERS

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-27
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · C+0.5 ✅ · C+1 ✅ · D ✅ · E ✅ · E+1 ✅ · F ✅ · G ✅
**Phạm vi:** Global search, advanced filters, saved filters, quick search bar.

---

## 0. Tại sao Epic J tồn tại

### Tier 1 đã verify trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| Có global search? | ❌ **KHÔNG** — chỉ có filter cứng trong page |
| Có saved filters? | ❌ **KHÔNG** — admin phải filter lại mỗi lần |
| Có quick search bar? | ❌ **KHÔNG** — search chỉ trong table |
| Asset list có pagination? | ❌ **KHÔNG** — load all → chậm với 1000+ assets |
| Search có fuzzy match? | ❌ **KHÔNG** — chỉ exact match |

---

## 1. MVP Plan — 4 deliverables

| # | Deliverable | Mục đích | Priority | Effort |
|---|-------------|----------|----------|--------|
| **J-1** | Global Search | Search mọi thứ từ 1 search bar | **P0** | 1 ngày |
| **J-2** | Advanced Filters | Filter theo nhiều criteria cùng lúc | **P0** | 1 ngày |
| **J-3** | Saved Filters | Lưu filter để dùng lại | P1 | 0.5 ngày |
| **J-4** | Pagination | Phân trang cho lists | P1 | 0.5 ngày |

**Tổng:** ~3 ngày

---

## 2. Architecture Design

### 2.1 Global Search Flow

```
User nhấn "/" hoặc click search icon
    ↓
Mở SearchModal overlay
    ↓
User gõ query
    ↓
Debounce 300ms → call API
    ↓
Search across:
  - Assets (assetTag, name, serial)
  - Users (name, email, employeeNum)
  - Licenses (name, productKey)
    ↓
Display results grouped by type
    ↓
Click result → navigate to detail page
```

### 2.2 Advanced Filter Flow

```
User click "Bộ lọc" button
    ↓
FilterPanel mở ra (sidebar hoặc dropdown)
    ↓
User chọn filters:
  - Status: [ ] Available [ ] Deployed [ ] Maintenance
  - Category: [ ] Laptop [ ] Phone [ ] Monitor
  - Location: [ ] HCM [ ] HN [ ] DN
  - Date range: từ __ đến __
  - Assigned: [ ] Assigned [ ] Unassigned
    ↓
Click "Áp dụng"
    ↓
URL updated với query params
    ↓
Table re-fetch với filters
```

### 2.3 Pagination Pattern

```
Page hiện tại: /assets?page=1&limit=20&status=available
    ↓
Total items: 150
    ↓
Total pages: 8
    ↓
UI: [1] [2] [3] ... [8] | << < 1-20/150 > >>
```

---

## 3. Files thay đổi

### 3.1 New files

| File | Mô tả |
|------|--------|
| `src/components/search/GlobalSearchModal.tsx` | Global search modal với "/" shortcut |
| `src/components/search/SearchInput.tsx` | Reusable search input component |
| `src/app/api/search/route.ts` | Global search API |
| `src/app/api/assets/route.ts` | Assets API với pagination + filters |
| `src/lib/search.ts` | Search utilities (debounce, highlight) |
| `src/components/assets/FilterPanel.tsx` | Advanced filter panel |
| `src/components/ui/Pagination.tsx` | Reusable pagination component |

### 3.2 Modified files

| File | Thay đổi |
|------|----------|
| `src/app/assets/page.tsx` | Thêm pagination + filter params |
| `src/app/assets/AssetsPageClient.tsx` | Sử dụng FilterPanel + Pagination |
| `src/components/Header.tsx` | Thêm search icon + "/" shortcut |
| `src/app/layout.tsx` | Thêm keyboard shortcut listener |

---

## 4. API Design

### 4.1 GET /api/search

```typescript
// Request
GET /api/search?q=laptop&type=ASSET,USER

// Response
{
  "ok": true,
  "data": {
    "assets": [
      { "id": "...", "assetTag": "AST001", "name": "Laptop Dell XPS", "type": "ASSET" }
    ],
    "users": [
      { "id": "...", "firstName": "Nguyen", "lastName": "Van A", "type": "USER" }
    ],
    "licenses": [],
    "total": 2
  }
}
```

### 4.2 GET /api/assets

```typescript
// Request
GET /api/assets?page=1&limit=20&status=available&categoryId=xxx&assigned=true

// Response
{
  "ok": true,
  "data": {
    "items": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## 5. Tiêu chí nghiệm thu

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| **J-1** | Nhấn "/" → Search modal mở | Browser |
| **J-2** | Gõ "dell" → hiển thị assets chứa "dell" | Browser |
| **J-3** | Filter assets by status → đúng results | Browser |
| **J-4** | Pagination hiển thị đúng trang | Browser |
| **J-5** | URL có query params khi filter | Browser |
| **J-6** | `npx tsc --noEmit` PASS | Shell |
| **J-7** | `npx jest` PASS | Shell |

---

## BƯỚC 0: Pre-Audit

```bash
cd "D:\IT-management"

npx tsc --noEmit 2>&1 | head -5
# Expected: 0 errors

npx jest --silent 2>&1 | tail -3
# Expected: PASS
```

---

## PHẦN 1: GLOBAL SEARCH

### BƯỚC 1: Tạo `src/app/api/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface SearchResult {
  id: string
  assetTag?: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  serial?: string
  type: 'ASSET' | 'USER' | 'LICENSE'
  href: string
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const types = searchParams.get('type')?.split(',') ?? ['ASSET', 'USER', 'LICENSE']
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, data: { assets: [], users: [], licenses: [], total: 0 } })
  }

  const results: Record<string, SearchResult[]> = {
    ASSET: [],
    USER: [],
    LICENSE: [],
  }

  // Search Assets
  if (types.includes('ASSET')) {
    const assets = await prisma.asset.findMany({
      where: {
        deletedAt: null,
        OR: [
          { assetTag: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { serial: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, assetTag: true, name: true, serial: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    results.ASSET = assets.map((a) => ({
      id: a.id,
      assetTag: a.assetTag,
      name: a.name,
      serial: a.serial ?? undefined,
      type: 'ASSET' as const,
      href: `/assets/${a.id}`,
    }))
  }

  // Search Users
  if (types.includes('USER')) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { employeeNum: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    results.USER = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName ?? undefined,
      email: u.email ?? undefined,
      type: 'USER' as const,
      href: `/users/${u.id}`,
    }))
  }

  // Search Licenses
  if (types.includes('LICENSE')) {
    const licenses = await prisma.license.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { productKey: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    results.LICENSE = licenses.map((l) => ({
      id: l.id,
      name: l.name,
      type: 'LICENSE' as const,
      href: `/licenses/${l.id}`,
    }))
  }

  const total = results.ASSET.length + results.USER.length + results.LICENSE.length

  return NextResponse.json({ ok: true, data: { ...results, total } })
}
```

---

### BƯỚC 2: Tạo `src/components/search/GlobalSearchModal.tsx`

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, User, Key, X, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  assetTag?: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  serial?: string
  type: 'ASSET' | 'USER' | 'LICENSE'
  href: string
}

interface SearchResponse {
  ok: boolean
  data: {
    ASSET: SearchResult[]
    USER: SearchResult[]
    LICENSE: SearchResult[]
    total: number
  }
}

export default function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Keyboard shortcut: "/" to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !isOpen && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
        const data: SearchResponse = await res.json()
        if (data.ok) {
          const all: SearchResult[] = [
            ...data.data.ASSET,
            ...data.data.USER,
            ...data.data.LICENSE,
          ]
          setResults(all)
          setSelectedIndex(0)
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].href)
      setIsOpen(false)
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'ASSET': return <Package size={16} className="text-blue-500" />
      case 'USER': return <User size={16} className="text-green-500" />
      case 'LICENSE': return <Key size={16} className="text-purple-500" />
      default: return null
    }
  }

  function getSubtitle(result: SearchResult) {
    if (result.type === 'ASSET') {
      return result.assetTag + (result.serial ? ` · ${result.serial}` : '')
    }
    if (result.type === 'USER') {
      return result.email ?? ''
    }
    return ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm tài sản, người dùng, license..."
            className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          />
          {isLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto py-2">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => {
                  router.push(result.href)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                  index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                {getIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{result.name}</div>
                  <div className="text-xs text-gray-500 truncate">{getSubtitle(result)}</div>
                </div>
                <span className="text-xs text-gray-400 uppercase">{result.type}</span>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !isLoading && (
          <div className="py-8 text-center text-gray-500">
            Không tìm thấy kết quả cho "{query}"
          </div>
        )}

        {query.length < 2 && (
          <div className="py-6 text-center text-gray-400 text-sm">
            Nhập ít nhất 2 ký tự để tìm kiếm
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Enter</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## PHẦN 2: PAGINATION

### BƯỚC 3: Tạo `src/components/ui/Pagination.tsx`

```typescript
'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  function getPageNumbers() {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div className="text-sm text-gray-500">
        Hiển thị {startItem}-{endItem} / {totalItems} mục
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 px-3 text-sm rounded-lg transition ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trang cuối"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  )
}
```

---

## PHẦN 3: ADVANCED FILTERS

### BƯỚC 4: Tạo `src/components/assets/FilterPanel.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'
import type { StatusLabel, Category, Location } from '@prisma/client'

interface FilterPanelProps {
  statuses: StatusLabel[]
  categories: Category[]
  locations: Location[]
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
    params.set('page', '1') // Reset to page 1 when filter
    router.push(`/assets?${params.toString()}`)
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
            : 'border-gray-200 hover:bg-gray-50'
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
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-xl border border-gray-200 w-80 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
```

---

## PHẦN 4: UPDATE ASSETS PAGE

### BƯỚC 5: Cập nhật `src/app/assets/page.tsx`

```typescript
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import AssetsPageClient from './AssetsPageClient'
import Pagination from '@/components/ui/Pagination'
import FilterPanel from '@/components/assets/FilterPanel'

const ITEMS_PER_PAGE = 20

interface PageProps {
  searchParams: Promise<{
    page?: string
    statusId?: string
    categoryId?: string
    locationId?: string
    assigned?: string
    search?: string
  }>
}

async function getPageData(searchParams: PageProps['searchParams']) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const skip = (page - 1) * ITEMS_PER_PAGE

  // Build where clause
  const where: Record<string, unknown> = { deletedAt: null }

  if (params.statusId) {
    where.statusId = params.statusId
  }
  if (params.categoryId) {
    where.categoryId = params.categoryId
  }
  if (params.locationId) {
    where.assignedLocationId = params.locationId
  }
  if (params.assigned === 'assigned') {
    where.assignedUserId = { not: null }
  } else if (params.assigned === 'unassigned') {
    where.assignedUserId = null
  }
  if (params.search) {
    where.OR = [
      { assetTag: { contains: params.search, mode: 'insensitive' } },
      { name: { contains: params.search, mode: 'insensitive' } },
      { serial: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [assets, total, statuses, categories, locations, users] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        status: true,
        assignedUser: true,
        assignedLocation: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.asset.count({ where }),
    prisma.statusLabel.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    }),
    prisma.location.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { activated: true, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    }),
  ])

  return {
    assets,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    statuses,
    categories,
    locations,
    users,
  }
}

export default async function AssetsPage({ searchParams }: PageProps) {
  const data = await getPageData(searchParams)

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Đang tải...</div>}>
      <AssetsPageClient
        assets={data.assets}
        users={data.users}
        locations={data.locations}
      />
      <FilterPanel
        statuses={data.statuses}
        categories={data.categories}
        locations={data.locations}
      />
      <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        totalItems={data.total}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={(page) => {
          // This will be handled client-side
        }}
      />
    </Suspense>
  )
}
```

---

## BƯỚC 6: Final Verify

```bash
cd "D:\IT-management"

npx tsc --noEmit 2>&1 | tail -5
# Expected: 0 errors

npx jest --silent 2>&1 | tail -5
# Expected: PASS

npm run build 2>&1 | tail -5
# Expected: ✓ Compiled successfully
```

---

## Phụ lục: Effort estimate

| Bước | Nội dung | Effort |
|------|---------|--------|
| 0 | Pre-audit | 15 phút |
| 1 | Global search API | 1 giờ |
| 2 | Global search modal | 1.5 giờ |
| 3 | Pagination component | 1 giờ |
| 4 | Filter panel | 1.5 giờ |
| 5 | Update assets page | 1 giờ |
| 6 | Final verify | 30 phút |
| **Tổng** | | **~6 giờ = 1.5 ngày** |

---

**HẾT MSEW-epic-J-advanced-search.md**

Tổng kết: 6 bước, ~8 file (6 mới + 2 sửa), ~1500 dòng code, effort ~1.5 ngày. Global search, advanced filters, pagination.