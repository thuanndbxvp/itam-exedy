'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Lock, Shield, Bell, Palette } from 'lucide-react'

interface NavUser {
  firstName?: string | null
  lastName?: string | null
}

interface NavItem {
  href: string
  label: string
  icon: typeof User
}

const items: NavItem[] = [
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/password', label: 'Mật khẩu', icon: Lock },
  { href: '/account/security', label: 'Bảo mật', icon: Shield },
  { href: '/account/notifications', label: 'Thông báo', icon: Bell },
  { href: '/account/appearance', label: 'Giao diện', icon: Palette },
]

export default function UserPanelNav({ user }: { user: NavUser }) {
  const pathname = usePathname()

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'User'
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 p-4 hidden md:block">
      <div className="mb-6 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
          {initials || 'U'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
          <p className="text-xs text-gray-500">User Panel</p>
        </div>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}