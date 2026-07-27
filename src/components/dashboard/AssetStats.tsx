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
    { label: 'Tổng tài sản', value: totalAssets, icon: Package, colorClass: 'bg-blue-50 text-blue-600' },
    { label: 'Đã cấp phát', value: checkedOutAssets, icon: ArrowUpRight, colorClass: 'bg-green-50 text-green-600' },
    { label: 'Sẵn sàng', value: availableAssets, icon: Package, colorClass: 'bg-emerald-50 text-emerald-600' },
    { label: 'Chờ duyệt', value: pendingAssets, icon: ArrowDownRight, colorClass: 'bg-yellow-50 text-yellow-600' },
    { label: 'Người dùng', value: totalUsers, icon: Users, colorClass: 'bg-purple-50 text-purple-600' },
    { label: 'License', value: totalLicenses, icon: Key, colorClass: 'bg-indigo-50 text-indigo-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.colorClass}`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        )
      })}
    </div>
  )
}
