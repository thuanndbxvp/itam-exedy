'use client'

/**
 * DashboardClient — Sprint R.4 Performance Optimization
 *
 * Lazy loads heavy components (charts, alerts) to improve initial page load.
 * Uses React Suspense for graceful loading states.
 */
import { useState, useEffect, lazy, Suspense } from 'react'

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

// C.11: Health Score types
interface HealthScoreData {
  distribution: { excellent: number; good: number; fair: number; poor: number; total: number }
  avgScore: number | null
  needsReplacement: number
  topReplacementCandidates: Array<{
    id: string
    assetTag: string
    name: string
    healthScore: number | null
    repairCount: number
    purchaseDate: string | null
  }>
}

// R.4: Lazy load heavy components
const AssetStats = lazy(() => import('./AssetStats'))
const StatusPieChart = lazy(() => import('./StatusPieChart'))
const CategoryBarChart = lazy(() => import('./CategoryBarChart'))
const LicenseExpiryAlert = lazy(() => import('./alerts/LicenseExpiryAlert'))
const AssetEolAlert = lazy(() => import('./alerts/AssetEolAlert'))
// C.11: Health Score
const HealthScoreSummary = lazy(() => import('./HealthScoreSummary'))

// Loading skeleton for lazy components
function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse">
      <div className="p-4">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

function AlertSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [healthScoreData, setHealthScoreData] = useState<HealthScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/summary').then((r) => r.json()),
      fetch('/api/reports/assets-by-status').then((r) => r.json()),
      fetch('/api/reports/assets-by-category').then((r) => r.json()),
      fetch('/api/reports/health-score-summary').then((r) => r.json()),
    ]).then(([summaryRes, statusRes, categoryRes, healthScoreRes]) => {
      if (summaryRes.ok) setSummary(summaryRes.data)
      if (statusRes.ok) setStatusData(statusRes.data)
      if (categoryRes.ok) setCategoryData(categoryRes.data)
      if (healthScoreRes.ok) setHealthScoreData(healthScoreRes.data)
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
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AlertSkeleton />
          <AlertSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AssetStats is small, load immediately */}
      <AssetStats
        totalAssets={summary.totalAssets}
        totalUsers={summary.totalUsers}
        totalLicenses={summary.totalLicenses}
        checkedOutAssets={summary.checkedOutAssets}
        availableAssets={summary.availableAssets}
        pendingAssets={summary.pendingAssets}
      />

      {/* Lazy load charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <StatusPieChart data={statusData} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <CategoryBarChart data={categoryData} />
        </Suspense>
      </div>

      {/* Lazy load alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<AlertSkeleton />}>
          <LicenseExpiryAlert />
        </Suspense>
        <Suspense fallback={<AlertSkeleton />}>
          <AssetEolAlert />
        </Suspense>
      </div>

      {/* C.11: Health Score Summary */}
      {healthScoreData && (
        <Suspense fallback={<AlertSkeleton />}>
          <HealthScoreSummary
            distribution={healthScoreData.distribution}
            avgScore={healthScoreData.avgScore}
            needsReplacement={healthScoreData.needsReplacement}
            topReplacementCandidates={healthScoreData.topReplacementCandidates}
          />
        </Suspense>
      )}
    </div>
  )
}
