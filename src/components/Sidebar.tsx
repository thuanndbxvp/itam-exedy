'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Monitor, Key, Settings, Menu, X, LifeBuoy, Inbox,
  Briefcase, LayoutGrid, Server, Activity, ChevronDown, ChevronRight, KeyRound
} from 'lucide-react'
import RoleGate from './RoleGate'

/**
 * Cache key cho permission set lưu trong sessionStorage.
 * Kèm timestamp (TTL 5 phút) để tránh stale cache khi user vừa được grant quyền mới.
 */
const PERM_CACHE_KEY = 'sidebar.perms.v1'
const PERM_CACHE_TTL_MS = 5 * 60 * 1000 // 5 phút

interface PermCache {
  userId: string
  permissions: string[]
  /** Epoch ms khi cache được tạo. */
  fetchedAt: number
}

function readPermCache(userId: string | undefined): string[] | null {
  if (typeof window === 'undefined' || !userId) return null
  try {
    const raw = window.sessionStorage.getItem(PERM_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PermCache
    if (parsed.userId !== userId) return null
    if (Date.now() - parsed.fetchedAt > PERM_CACHE_TTL_MS) return null
    return parsed.permissions
  } catch {
    return null
  }
}

function writePermCache(userId: string, permissions: string[]) {
  if (typeof window === 'undefined') return
  try {
    const payload: PermCache = { userId, permissions, fetchedAt: Date.now() }
    window.sessionStorage.setItem(PERM_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / privacy mode
  }
}

type IconKey = React.ElementType

type NavItem = {
  name: string
  href: string
  icon: IconKey
  allowedRoles: ('ADMIN' | 'IT_STAFF' | 'IT_MANAGER' | 'EMPLOYEE')[]
  /** Nếu set, nav item chỉ hiển thị khi user CÓ ÍT NHẤT 1 permission trong list */
  permissionKey?: string
  children?: { label: string; href: string; icon: IconKey; permissionKey?: string }[]
}

const SETTINGS_GROUPS = [
  {
    title: 'Tổ chức & Nhân sự',
    icon: Briefcase,
    children: [
      { label: 'Công ty',    href: '/settings/companies',   icon: Briefcase, permissionKey: 'settings.update' },
      { label: 'Phòng ban',  href: '/settings/departments', icon: Briefcase, permissionKey: 'settings.update' },
      { label: 'Người dùng', href: '/settings/users',       icon: Briefcase, permissionKey: 'users.read' },
    ],
  },
  {
    title: 'Danh mục Tài sản',
    icon: LayoutGrid,
    children: [
      { label: 'Trạng thái',     href: '/settings/statuses',     icon: LayoutGrid, permissionKey: 'settings.update' },
      { label: 'Danh mục',       href: '/settings/categories',   icon: LayoutGrid, permissionKey: 'settings.update' },
      { label: 'Model thiết bị', href: '/settings/asset-models', icon: LayoutGrid, permissionKey: 'settings.update' },
      { label: 'Nhà sản xuất',   href: '/settings/manufacturers', icon: LayoutGrid, permissionKey: 'settings.update' },
      { label: 'Nhà cung cấp',   href: '/settings/suppliers',     icon: LayoutGrid, permissionKey: 'settings.update' },
      { label: 'Vị trí',         href: '/settings/locations',     icon: LayoutGrid, permissionKey: 'settings.update' },
      { label: 'Khấu hao',       href: '/settings/depreciation',  icon: LayoutGrid, permissionKey: 'settings.update' },
    ],
  },
  {
    title: 'Hệ thống',
    icon: Server,
    children: [
      { label: 'Tổng quan',   href: '/settings/general',  icon: Server, permissionKey: 'settings.read' },
      { label: 'Thương hiệu', href: '/settings/branding', icon: Server, permissionKey: 'settings.update' },
      { label: 'Bảo mật',     href: '/settings/security', icon: Server, permissionKey: 'settings.update' },
      { label: 'Email',       href: '/settings/email',    icon: Server, permissionKey: 'settings.update' },
      { label: 'Phân quyền',  href: '/settings/permissions', icon: KeyRound, permissionKey: 'users.manage_roles' },
      { label: 'Quản trị Helpdesk', href: '/admin/helpdesk', icon: Settings, permissionKey: 'helpdesk.manage_rules' },
    ],
  },
  {
    title: 'Hoạt động',
    icon: Activity,
    children: [
      { label: 'Nhật ký', href: '/settings/audit-log', icon: Activity, permissionKey: 'settings.read' },
    ],
  },
] as const

const navigation: NavItem[] = [
  { name: 'Dashboard',          href: '/',                icon: LayoutDashboard, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'] },
  { name: 'Tài sản (Assets)',   href: '/assets',          icon: Monitor,          allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'], permissionKey: 'assets.read' },
  { name: 'Bản quyền (Licenses)', href: '/licenses',      icon: Key,              allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'], permissionKey: 'licenses.read' },
  { 
    name: 'Helpdesk',           
    href: '/helpdesk',        
    icon: LifeBuoy,         
    allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'],
    permissionKey: 'helpdesk.view',
  },
  {
    name: 'Cài đặt (Settings)',
    href: '/settings',
    icon: Settings,
    allowedRoles: ['ADMIN'],
    permissionKey: 'settings.read',
    children: SETTINGS_GROUPS.flatMap((g) => g.children.map((c) => ({ ...c, icon: g.icon }))),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [perms, setPerms] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  const { data: session } = useSession()
  const isIt = session?.user?.role === 'IT_STAFF' || session?.user?.role === 'IT_MANAGER' || session?.user?.role === 'ADMIN'

  useEffect(() => {
    const userId = session?.user?.id

    // Đọc cache trước — tránh flash + giảm API call khi re-mount.
    const cached = readPermCache(userId)
    if (cached) {
      setPerms(new Set(cached))
      setLoaded(true)
      return
    }

    fetch('/api/me/permissions')
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = '/login'
          return
        }
        if (!r.ok) return
        const text = await r.text()
        if (!text) return
        try {
          const d = JSON.parse(text)
          if (d.ok && d.data) {
            const list: string[] = d.data.permissions
            setPerms(new Set(list))
            if (userId) writePermCache(userId, list)
          }
        } catch (e) {
          console.error('Sidebar permissions parse error:', e)
        }
      })
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [session?.user?.id])

  useEffect(() => {
    const initialOpenMenus: Record<string, boolean> = {}
    navigation.forEach((item) => {
      if (item.children && pathname.startsWith(item.href)) {
        initialOpenMenus[item.name] = true
      }
    })
    setOpenMenus(initialOpenMenus)
  }, [pathname])

  function has(key?: string) {
    if (!key) return true
    if (!loaded) return true // optimistic: hiển thị trước, API sẽ lọc sau khi load
    return perms.has(key)
  }

  const toggleMenu = (name: string, e: React.MouseEvent) => {
    e.preventDefault()
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-gray-600"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 font-bold text-xl tracking-tight border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg mr-3 flex items-center justify-center">
            <Monitor size={18} className="text-white" />
          </div>
          IT Manager
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.filter((item) => has(item.permissionKey)).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname === item.href)
            const hasChildren = !!item.children
            const isMenuOpen = openMenus[item.name]
            const isOnSettingsBranch = hasChildren && pathname.startsWith(item.href) && item.href !== '/'

            if (hasChildren) {
              return (
                <RoleGate key={item.name} allowedRoles={item.allowedRoles}>
                  <div>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center px-3 py-2.5 rounded-lg transition-colors group justify-between
                        ${isOnSettingsBranch
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <item.icon
                          className={`mr-3 h-5 w-5 ${isOnSettingsBranch ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                        />
                        <span className="font-medium text-[15px]">{item.name}</span>
                      </div>
                      <button 
                        onClick={(e) => toggleMenu(item.name, e)}
                        className="p-1 rounded-md hover:bg-black/20 transition-colors"
                        aria-label="Mở rộng menu"
                      >
                        {isMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </Link>

                    {isMenuOpen && (
                      <div className="mt-2 space-y-3 pl-3 pr-1">
                        {item.name === 'Cài đặt (Settings)' ? (
                          SETTINGS_GROUPS.map((group) => {
                            const visibleChildren = group.children.filter((c) => has(c.permissionKey))
                            if (visibleChildren.length === 0) return null
                            return (
                              <div key={group.title}>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <group.icon size={13} />
                                  <span>{group.title}</span>
                                </div>
                                <div className="mt-1 space-y-0.5">
                                  {visibleChildren.map((child) => {
                                    const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')
                                    return (
                                      <Link
                                        key={child.href}
                                        href={child.href}
                                        className={`
                                          flex items-center px-3 py-2 rounded-md transition-colors text-sm
                                          ${isChildActive
                                            ? 'bg-slate-800 text-white font-medium'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                          }
                                        `}
                                      >
                                        <span className="w-1 h-1 rounded-full bg-current mr-2 opacity-60" />
                                        {child.label}
                                      </Link>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="mt-1 space-y-0.5">
                            {(item.children || []).filter((c) => has(c.permissionKey)).map((child) => {
                              const isChildActive = pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href))
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`
                                    flex items-center px-3 py-2 rounded-md transition-colors text-sm
                                    ${isChildActive
                                      ? 'bg-slate-800 text-white font-medium'
                                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }
                                  `}
                                >
                                  <child.icon size={14} className="mr-2" />
                                  {child.label === 'Ticket của tôi' && isIt ? 'Tất cả Ticket' : child.label}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </RoleGate>
              )
            }

            return (
              <RoleGate key={item.name} allowedRoles={item.allowedRoles}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg transition-colors group
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                  />
                  <span className="font-medium text-[15px]">{item.name}</span>
                </Link>
              </RoleGate>
            )
          })}
        </nav>
      </div>
    </>
  )
}