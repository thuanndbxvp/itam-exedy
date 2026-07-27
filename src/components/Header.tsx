'use client'

import { Search, LogOut, User as UserIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

export default function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  // Tạo title dựa trên path
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/assets/new')) return 'Thêm mới Tài sản'
    if (pathname.startsWith('/assets')) return 'Quản lý Tài sản'
    if (pathname.startsWith('/licenses/new')) return 'Thêm mới Bản quyền'
    if (pathname.startsWith('/licenses')) return 'Quản lý Bản quyền'
    if (pathname.startsWith('/settings')) return 'Cài đặt Hệ thống'
    if (pathname === '/helpdesk/new') return 'Báo lỗi / Yêu cầu hỗ trợ'
    if (pathname === '/helpdesk/inbox') return 'Hộp thư Helpdesk (IT)'
    if (pathname.startsWith('/helpdesk')) return 'Helpdesk của tôi'
    if (pathname.startsWith('/admin/helpdesk')) return 'Quản trị Helpdesk'
    if (pathname.startsWith('/reports')) return 'Báo cáo'
    return 'Hệ thống Quản lý'
  }

  // Hiển thị tên user từ session (A2 đã có firstName trong session.user)
  // Fallback: nếu chưa login (status=unauthenticated) → proxy sẽ redirect → không vào đây
  const userDisplayName = session?.user?.firstName
    ? `${session.user.firstName}${session.user.lastName ? ' ' + session.user.lastName : ''}`
    : '...'

  const userRole = session?.user?.role ?? 'EMPLOYEE'

  // Color badge theo role — Epic F
  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    IT_MANAGER: 'bg-blue-100 text-blue-700',
    IT_STAFF: 'bg-cyan-100 text-cyan-700',
    EMPLOYEE: 'bg-gray-100 text-gray-600',
  }
  const roleLabel: Record<string, string> = {
    ADMIN: 'Super Admin',
    IT_MANAGER: 'IT Manager',
    IT_STAFF: 'IT Staff',
    EMPLOYEE: 'Nhân viên',
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex-1 ml-10 lg:ml-0 flex items-center">
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <Search
            size={18}
            className="absolute left-3 text-gray-400 cursor-pointer hover:text-gray-600 transition"
            onClick={() => window.dispatchEvent(new Event('open-global-search'))}
          />
          <input
            type="text"
            readOnly
            placeholder="Tìm kiếm nhanh (nhấn /)..."
            onFocus={() => window.dispatchEvent(new Event('open-global-search'))}
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full outline-none cursor-pointer hover:bg-white transition-all w-64"
          />
        </div>

        {/* Notifications — Epic F: in-app bell */}
        <NotificationBell />

        {/* User Menu */}
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>{userDisplayName}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              roleColors[userRole] ?? 'bg-gray-100 text-gray-600'
            }`}>
              {roleLabel[userRole] ?? userRole}
            </span>
          </button>

          {showMenu && (
            <>
              {/* Backdrop để click ra ngoài thì đóng menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{userDisplayName}</p>
                  <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                </div>
                <Link
                  href="/account/profile"
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <UserIcon size={16} />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
