'use client'

import { useState, useEffect } from 'react'
import AssetStats from './AssetStats'
import StatusPieChart from './StatusPieChart'
import CategoryBarChart from './CategoryBarChart'
import LicenseExpiryAlert from './alerts/LicenseExpiryAlert'
import AssetEolAlert from './alerts/AssetEolAlert'

interface SummaryData {
  totalAssets: number
  totalUsers: number
  totalLicenses: number
  checkedOutAssets: number
  availableAssets: number
  pendingAssets: number
}

interface StatusData {
  statusId: string
  statusName: string
  color: string
  count: number
}

interface CategoryData {
  categoryId: string | null
  categoryName: string
  color: string
  count: number
}

export default function DashboardClient() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/summary').then((r) => r.json()),
      fetch('/api/reports/assets-by-status').then((r) => r.json()),
      fetch('/api/reports/assets-by-category').then((r) => r.json()),
    ]).then(([summaryRes, statusRes, categoryRes]) => {
      if (summaryRes.ok) setSummary(summaryRes.data)
      if (statusRes.ok) setStatusData(statusRes.data)
      if (categoryRes.ok) setCategoryData(categoryRes.data)
      setLoading(false)
    })
  }, [])

  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-gray-200 mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AssetStats
        totalAssets={summary.totalAssets}
        totalUsers={summary.totalUsers}
        totalLicenses={summary.totalLicenses}
        checkedOutAssets={summary.checkedOutAssets}
        availableAssets={summary.availableAssets}
        pendingAssets={summary.pendingAssets}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusPieChart data={statusData} />
        <CategoryBarChart data={categoryData} />
      </div>

      {/* Phase 3 — Proactive alert widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LicenseExpiryAlert />
        <AssetEolAlert />
      </div>
    </div>
  )
}
