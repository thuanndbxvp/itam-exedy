'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Lock, Shield, Bell, Palette } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: typeof User
}

const items: NavItem[] = [
  { href: '/account/profile', label: 'Hồ sơ', icon: User },
  { href: '/account/password', label: 'Mật khẩu', icon: Lock },
  { href: '/account/security', label: 'Bảo mật', icon: Shield },
  { href: '/account/notifications', label: 'Thông báo', icon: Bell },
  { href: '/account/appearance', label: 'Giao diện', icon: Palette },
]

export default function UserPanelNav() {
  const pathname = usePathname()
  return (
    <div className="w-full bg-white border-b border-gray-200 shrink-0">
      {/* GitHub-style horizontal tab nav */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-1 -mb-px">
          {items.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-700 -mb-px'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}