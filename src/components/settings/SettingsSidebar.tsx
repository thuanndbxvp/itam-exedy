'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings,
  Palette,
  Shield,
  Building2,
  Users,
  Tag,
  FolderOpen,
  TrendingDown,
  Mail,
  ScrollText,
  Factory,
  Package,
  MapPin,
  Box,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/settings/general', icon: Settings },
  { label: 'Thương hiệu', href: '/settings/branding', icon: Palette },
  { label: 'Bảo mật', href: '/settings/security', icon: Shield },
  { label: 'Công ty', href: '/settings/companies', icon: Building2 },
  { label: 'Người dùng', href: '/settings/users', icon: Users },
  { label: 'Trạng thái', href: '/settings/statuses', icon: Tag },
  { label: 'Danh mục', href: '/settings/categories', icon: FolderOpen },
  { label: 'Model thiết bị', href: '/settings/asset-models', icon: Box },
  { label: 'Nhà sản xuất', href: '/settings/manufacturers', icon: Factory },
  { label: 'Nhà cung cấp', href: '/settings/suppliers', icon: Package },
  { label: 'Vị trí', href: '/settings/locations', icon: MapPin },
  { label: 'Khấu hao', href: '/settings/depreciation', icon: TrendingDown },
  { label: 'Email', href: '/settings/email', icon: Mail },
  { label: 'Nhật ký', href: '/settings/audit-log', icon: ScrollText },
]

export default function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 p-4 shrink-0">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
        Cài đặt hệ thống
      </h2>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
