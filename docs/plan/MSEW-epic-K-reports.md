# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC K — REPORTS & ANALYTICS

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-27
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · C+0.5 ✅ · C+1 ✅ · D ✅ · E ✅ · E+1 ✅ · F ✅ · G ✅ · J ✅
**Phạm vi:** Dashboard charts, reports page, audit log viewer, data export.

---

## 0. Tại sao Epic K tồn tại

### Tier 1 đã verify trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| Có dashboard charts? | ❌ **KHÔNG** — chỉ có stats numbers |
| Có reports page? | ❌ **KHÔNG** — xem audit log ở settings |
| Có asset depreciation report? | ❌ **KHÔNG** |
| Có asset summary by category? | ❌ **KHÔNG** |

---

## 1. MVP Plan — 4 deliverables

| # | Deliverable | Mục đích | Priority | Effort |
|---|-------------|----------|----------|--------|
| **K-1** | Dashboard Charts | Hiển thị chart trên dashboard | **P0** | 1 ngày |
| **K-2** | Audit Log Viewer | Xem nhật ký hành động | **P0** | 0.5 ngày |
| **K-3** | Asset Summary Report | Tổng hợp tài sản theo category | P1 | 0.5 ngày |
| **K-4** | Activity Report | Báo cáo hoạt động theo tháng | P2 | 0.5 ngày |

**Tổng:** ~2.5 ngày

---

## 2. Architecture Design

### 2.1 Dashboard Charts

```
Dashboard page
    ↓
Load stats + chart data
    ↓
Display:
  - Total Assets (number)
  - Assets by Status (pie chart)
  - Assets by Category (bar chart)
  - Recent Activity (list)
```

### 2.2 Chart Types

| Chart | Type | Data |
|-------|------|------|
| Assets by Status | Pie/Doughnut | Count by status name |
| Assets by Category | Bar (horizontal) | Count by category name |
| Assets over Time | Line | Count by month |
| Checkout Activity | Bar | Checkout count by day/week |

---

## 3. Files thay đổi

### 3.1 New files

| File | Mô tả |
|------|--------|
| `src/app/api/reports/summary/route.ts` | Asset summary stats |
| `src/app/api/reports/assets-by-status/route.ts` | Assets grouped by status |
| `src/app/api/reports/assets-by-category/route.ts` | Assets grouped by category |
| `src/app/api/reports/activity/route.ts` | Recent activity feed |
| `src/app/api/audit-log/route.ts` | Audit log với pagination |
| `src/components/dashboard/AssetStats.tsx` | Stats cards |
| `src/components/dashboard/StatusPieChart.tsx` | Pie chart |
| `src/components/dashboard/CategoryBarChart.tsx` | Bar chart |
| `src/components/dashboard/ActivityFeed.tsx` | Recent activity list |
| `src/components/reports/AuditLogTable.tsx` | Audit log table |
| `src/app/reports/page.tsx` | Reports page |
| `src/app/audit-log/page.tsx` | Audit log page |

### 3.2 Modified files

| File | Thay đổi |
|------|----------|
| `src/app/page.tsx` | Thêm charts vào dashboard |

---

## 4. Tiêu chí nghiệm thu

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| **K-1** | Dashboard hiển thị pie chart | Browser |
| **K-2** | Dashboard hiển thị bar chart | Browser |
| **K-3** | /audit-log hiển thị log | Browser |
| **K-4** | /reports hiển thị summary | Browser |
| **K-5** | `npx tsc --noEmit` PASS | Shell |
| **K-6** | `npx jest` PASS | Shell |

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

## PHẦN 1: DASHBOARD API

### BƯỚC 1: Tạo `src/app/api/reports/summary/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const [
    totalAssets,
    totalUsers,
    totalLicenses,
    checkedOutAssets,
    availableAssets,
    pendingAssets,
  ] = await Promise.all([
    prisma.asset.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.license.count({ where: { deletedAt: null } }),
    prisma.asset.count({
      where: { deletedAt: null, assignedUserId: { not: null } },
    }),
    prisma.asset.count({
      where: { deletedAt: null, status: { deployable: true, pending: false, archived: false } },
    }),
    prisma.asset.count({
      where: { deletedAt: null, status: { pending: true } },
    }),
  ])

  return NextResponse.json({
    ok: true,
    data: {
      totalAssets,
      totalUsers,
      totalLicenses,
      checkedOutAssets,
      availableAssets,
      pendingAssets,
    },
  })
}
```

---

### BƯỚC 2: Tạo `src/app/api/reports/assets-by-status/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const data = await prisma.asset.groupBy({
    by: ['statusId'],
    where: { deletedAt: null },
    _count: { id: true },
  })

  const statuses = await prisma.statusLabel.findMany({
    where: { id: { in: data.map((d) => d.statusId) } },
    select: { id: true, name: true, color: true, deployable: true, pending: true, archived: true },
  })

  const result = data.map((d) => {
    const status = statuses.find((s) => s.id === d.statusId)
    return {
      statusId: d.statusId,
      statusName: status?.name ?? 'Unknown',
      color: status?.color ?? '#gray',
      deployable: status?.deployable ?? false,
      pending: status?.pending ?? false,
      archived: status?.archived ?? false,
      count: d._count.id,
    }
  })

  return NextResponse.json({ ok: true, data: result })
}
```

---

### BƯỚC 3: Tạo `src/app/api/reports/assets-by-category/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const data = await prisma.asset.groupBy({
    by: ['categoryId'],
    where: { deletedAt: null, categoryId: { not: null } },
    _count: { id: true },
  })

  const categories = await prisma.category.findMany({
    where: { id: { in: data.map((d) => d.categoryId ?? '') } },
    select: { id: true, name: true, color: true },
  })

  const result = data
    .map((d) => {
      const category = categories.find((c) => c.id === d.categoryId)
      return {
        categoryId: d.categoryId,
        categoryName: category?.name ?? 'Unknown',
        color: category?.color ?? '#6b7280',
        count: d._count.id,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10

  return NextResponse.json({ ok: true, data: result })
}
```

---

## PHẦN 2: DASHBOARD COMPONENTS

### BƯỚC 4: Tạo `src/components/dashboard/AssetStats.tsx`

```typescript
'use client'

import { Package, Users, Key, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface AssetStatsProps {
  totalAssets: number
  totalUsers: number
  totalLicenses: number
  checkedOutAssets: number
  availableAssets: number
  pendingAssets: number
}

export default function AssetStats({
  totalAssets,
  totalUsers,
  totalLicenses,
  checkedOutAssets,
  availableAssets,
  pendingAssets,
}: AssetStatsProps) {
  const stats = [
    {
      label: 'Tổng tài sản',
      value: totalAssets,
      icon: Package,
      color: 'blue',
    },
    {
      label: 'Đã cấp phát',
      value: checkedOutAssets,
      icon: ArrowUpRight,
      color: 'green',
    },
    {
      label: 'Sẵn sàng',
      value: availableAssets,
      icon: Package,
      color: 'emerald',
    },
    {
      label: 'Chờ duyệt',
      value: pendingAssets,
      icon: ArrowDownRight,
      color: 'yellow',
    },
    {
      label: 'Người dùng',
      value: totalUsers,
      icon: Users,
      color: 'purple',
    },
    {
      label: 'License',
      value: totalLicenses,
      icon: Key,
      color: 'indigo',
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className={`w-10 h-10 rounded-lg ${colorMap[stat.color]} flex items-center justify-center mb-3`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        )
      })}
    </div>
  )
}
```

---

### BƯỚC 5: Tạo `src/components/dashboard/StatusPieChart.tsx`

```typescript
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface StatusData {
  statusId: string
  statusName: string
  color: string
  count: number
}

interface StatusPieChartProps {
  data: StatusData[]
}

const COLORS = [
  '#10b981', // green - deployable
  '#f59e0b', // yellow - pending
  '#ef4444', // red - undeployable
  '#6b7280', // gray - archived
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

export default function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    fill: d.color || COLORS[i % COLORS.length],
  }))

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Không có dữ liệu
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tài sản theo trạng thái</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="count"
            nameKey="statusName"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value} tài sản`, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

---

### BƯỚC 6: Tạo `src/components/dashboard/CategoryBarChart.tsx`

```typescript
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CategoryData {
  categoryId: string
  categoryName: string
  color: string
  count: number
}

interface CategoryBarChartProps {
  data: CategoryData[]
}

export default function CategoryBarChart({ data }: CategoryBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Không có dữ liệu
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top 10 danh mục</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="categoryName"
            tick={{ fontSize: 12 }}
            width={100}
          />
          <Tooltip
            formatter={(value: number) => [`${value} tài sản`, 'Số lượng']}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

---

## PHẦN 3: AUDIT LOG PAGE

### BƯỚC 7: Tạo `src/app/audit-log/page.tsx`

```typescript
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import AuditLogTable from '@/components/reports/AuditLogTable'
import { requireRole } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{
    page?: string
    actionType?: string
    itemType?: string
    userId?: string
    from?: string
    to?: string
  }>
}

const ITEMS_PER_PAGE = 20

async function getAuditLogs(searchParams: PageProps['searchParams']) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const skip = (page - 1) * ITEMS_PER_PAGE

  const where: Record<string, unknown> = {}

  if (params.actionType) {
    where.actionType = params.actionType
  }
  if (params.itemType) {
    where.itemType = params.itemType
  }
  if (params.userId) {
    where.userId = params.userId
  }
  if (params.from || params.to) {
    where.createdAt = {}
    if (params.from) {
      (where.createdAt as Record<string, unknown>).gte = new Date(params.from)
    }
    if (params.to) {
      (where.createdAt as Record<string, unknown>).lte = new Date(params.to + 'T23:59:59')
    }
  }

  const [logs, total, users] = await Promise.all([
    prisma.actionLog.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.actionLog.count({ where }),
    prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    users,
  }
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  await requireRole('ADMIN').catch(() => redirect('/'))

  const data = await getAuditLogs(searchParams)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nhật ký hành động</h1>
        <p className="text-gray-500">Theo dõi tất cả hoạt động trong hệ thống</p>
      </div>

      <AuditLogTable
        logs={data.logs}
        users={data.users}
        currentPage={data.page}
        totalPages={data.totalPages}
        totalItems={data.total}
      />
    </div>
  )
}
```

---

### BƯỚC 8: Tạo `src/components/reports/AuditLogTable.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Pagination from '@/components/ui/Pagination'
import { formatDistanceToNow } from '@/lib/date'

interface Log {
  id: string
  actionType: string
  itemType: string
  itemId: string
  targetType: string | null
  targetId: string | null
  notes: string | null
  createdAt: Date
  user: { firstName: string; lastName: string | null } | null
}

interface User {
  id: string
  firstName: string
  lastName: string | null
}

interface AuditLogTableProps {
  logs: Log[]
  users: User[]
  currentPage: number
  totalPages: number
  totalItems: number
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  CHECKOUT: 'bg-purple-100 text-purple-700',
  CHECKIN: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
  AUDIT: 'bg-yellow-100 text-yellow-700',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  CHECKOUT: 'Cấp phát',
  CHECKIN: 'Thu hồi',
  DELETE: 'Xóa',
  AUDIT: 'Kiểm kê',
  RESTORE: 'Khôi phục',
  NOTE_ADDED: 'Ghi chú',
  ACCEPTED: 'Chấp nhận',
  DECLINED: 'Từ chối',
}

export default function AuditLogTable({
  logs,
  users,
  currentPage,
  totalPages,
  totalItems,
}: AuditLogTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    actionType: searchParams.get('actionType') ?? '',
    itemType: searchParams.get('itemType') ?? '',
    userId: searchParams.get('userId') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  })

  function applyFilters() {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.set('page', '1')
    router.push(`/audit-log?${params.toString()}`)
  }

  function clearFilters() {
    setFilters({
      actionType: '',
      itemType: '',
      userId: '',
      from: '',
      to: '',
    })
    router.push('/audit-log')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.actionType}
            onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả hành động</option>
            <option value="CREATE">Tạo mới</option>
            <option value="UPDATE">Cập nhật</option>
            <option value="CHECKOUT">Cấp phát</option>
            <option value="CHECKIN">Thu hồi</option>
            <option value="DELETE">Xóa</option>
          </select>

          <select
            value={filters.itemType}
            onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả loại</option>
            <option value="ASSET">Tài sản</option>
            <option value="LICENSE">License</option>
            <option value="USER">Người dùng</option>
          </select>

          <select
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả người dùng</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName}{u.lastName ? ' ' + u.lastName : ''}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Từ ngày"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Đến ngày"
          />

          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Lọc
          </button>

          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Xóa
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Loại</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Người thực hiện</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(log.createdAt))}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.actionType] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ACTION_LABELS[log.actionType] ?? log.actionType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.itemType}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {log.user ? `${log.user.firstName}${log.user.lastName ? ' ' + log.user.lastName : ''}` : 'System'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{log.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          Không có nhật ký nào
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={20}
        onPageChange={(page) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('page', page.toString())
          router.push(`/audit-log?${params.toString()}`)
        }}
      />
    </div>
  )
}
```

---

## BƯỚC 9: Final Verify

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

## Phụ lục A: Packages cần cài

```bash
npm install recharts date-fns
```

---

## Phụ lục B: Effort estimate

| Bước | Nội dung | Effort |
|------|---------|--------|
| 0 | Pre-audit | 15 phút |
| 1 | Summary API | 30 phút |
| 2 | Status API | 30 phút |
| 3 | Category API | 30 phút |
| 4 | AssetStats component | 1 giờ |
| 5 | StatusPieChart | 1 giờ |
| 6 | CategoryBarChart | 1 giờ |
| 7 | Audit log page | 1 giờ |
| 8 | AuditLogTable | 1.5 giờ |
| 9 | Final verify | 30 phút |
| **Tổng** | | **~8 giờ = 2 ngày** |

---

**HẾT MSEW-epic-K-reports.md**

Tổng kết: 9 bước, ~12 file (10 mới + 2 sửa), ~2000 dòng code, effort ~2 ngày. Dashboard charts, audit log, reports.