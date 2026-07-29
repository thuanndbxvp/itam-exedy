'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Monitor, Key, Settings, Menu, X, LifeBuoy,
  Activity, ChevronDown, ChevronRight,
  Wrench, BarChart3, DollarSign, LogOut, Shield, Building2, MapPin,
  TrendingDown, Tag, Users, Building, UserCog, LayoutGrid, Server,
  Factory, Box, Truck, Sliders, Palette, Mail, FolderOpen, Package, ClipboardCheck
} from 'lucide-react'
import { signOut } from 'next-auth/react'

/* ─── Role badge helpers ─── */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', IT_MANAGER: 'IT Manager', IT_STAFF: 'IT Staff', EMPLOYEE: 'Employee',
}
const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-300', IT_MANAGER: 'bg-purple-500/20 text-purple-300',
  IT_STAFF: 'bg-blue-500/20 text-blue-300', EMPLOYEE: 'bg-slate-500/20 text-slate-300',
}

function getInitials(user?: { firstName?: string | null; lastName?: string | null }): string {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  if (!name) return 'U'
  return name.split(/\s+/).slice(0, 2).map((w) => (w[0] ?? '').toUpperCase()).join('')
}

/* ─── Permission cache ─── */
const PERM_CACHE_KEY = 'sidebar.perms.v1'
const PERM_CACHE_TTL_MS = 5 * 60 * 1000
interface PermCache { userId: string; permissions: string[]; fetchedAt: number }

function readPermCache(userId: string | undefined): string[] | null {
  if (typeof window === 'undefined' || !userId) return null
  try {
    const raw = window.sessionStorage.getItem(PERM_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PermCache
    if (parsed.userId !== userId) return null
    if (Date.now() - parsed.fetchedAt > PERM_CACHE_TTL_MS) return null
    return parsed.permissions
  } catch { return null }
}
function writePermCache(userId: string, permissions: string[]) {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.setItem(PERM_CACHE_KEY, JSON.stringify({ userId, permissions, fetchedAt: Date.now() })) }
  catch { /* ignore */ }
}

/* ─── Navigation structure ─── */
type IconKey = React.ElementType

type NavItem = {
  name: string
  href: string
  icon: IconKey
  allowedRoles: ('ADMIN' | 'IT_STAFF' | 'IT_MANAGER' | 'EMPLOYEE')[]
  permissionKey?: string
  children?: { label: string; href: string; icon: IconKey; permissionKey?: string }[]
  exact?: boolean
}

type NavGroup = {
  label: string
  icon: IconKey
  hideHeader?: boolean
  allowedRoles: ('ADMIN' | 'IT_STAFF' | 'IT_MANAGER' | 'EMPLOYEE')[]
  items: NavItem[]
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    label: 'Tổng quan',
    hideHeader: true,
    icon: LayoutDashboard,
    allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'],
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'] },
    ],
  },
  {
    label: 'Quản lý Tài sản',
    icon: Monitor,
    allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'],
    items: [
      { name: 'Thiết bị', href: '/assets', icon: Monitor, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'] },
      { name: 'Bản quyền', href: '/licenses', icon: Key, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'] },
      { name: 'Bảo trì', href: '/maintenances', icon: Wrench, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER'], permissionKey: 'assets.read' },
      { name: 'Loại tài sản', href: '/settings/categories', icon: FolderOpen, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Model thiết bị', href: '/settings/asset-models', icon: Box, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Nhà sản xuất', href: '/settings/manufacturers', icon: Factory, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Nhà cung cấp', href: '/settings/suppliers', icon: Package, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Vị trí', href: '/settings/locations', icon: MapPin, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Khấu hao', href: '/settings/depreciation', icon: TrendingDown, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Trạng thái', href: '/settings/statuses', icon: Tag, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
    ],
  },
  {
    label: 'Vận hành & Hỗ trợ',
    icon: LifeBuoy,
    allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'],
    items: [
      { name: 'Helpdesk', href: '/helpdesk', icon: LifeBuoy, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'], permissionKey: 'helpdesk.view' },
      { name: 'Quản trị Helpdesk', href: '/admin/helpdesk', icon: Settings, allowedRoles: ['ADMIN'], permissionKey: 'helpdesk.manage_rules' },
      { name: 'Báo cáo', href: '/reports', icon: BarChart3, allowedRoles: ['ADMIN', 'IT_MANAGER'], permissionKey: 'reports.view', exact: true },
      { name: 'Chi phí IT', href: '/reports/costs', icon: DollarSign, allowedRoles: ['ADMIN', 'IT_MANAGER'], permissionKey: 'reports.view', exact: true },
      { name: 'Kiểm kê', href: '/reports/audit', icon: ClipboardCheck, allowedRoles: ['ADMIN', 'IT_MANAGER'], permissionKey: 'reports.view', exact: true },
    ],
  },
  {
    label: 'Nhân sự & Tổ chức',
    icon: Users,
    allowedRoles: ['ADMIN'],
    items: [
      { name: 'Người dùng', href: '/settings/users', icon: Users, allowedRoles: ['ADMIN'], permissionKey: 'users.read' },
      { name: 'Phòng ban', href: '/settings/departments', icon: Building2, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Công ty', href: '/settings/companies', icon: Building, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Phân quyền', href: '/settings/permissions', icon: UserCog, allowedRoles: ['ADMIN'], permissionKey: 'users.manage_roles' },
    ],
  },
  {
    label: 'Hệ thống',
    icon: Server,
    allowedRoles: ['ADMIN'],
    items: [
      { name: 'Tổng quan', href: '/settings/general', icon: Sliders, allowedRoles: ['ADMIN'], permissionKey: 'settings.read' },
      { name: 'Thương hiệu', href: '/settings/branding', icon: Palette, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Bảo mật', href: '/settings/security', icon: Shield, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Email', href: '/settings/email', icon: Mail, allowedRoles: ['ADMIN'], permissionKey: 'settings.update' },
      { name: 'Nhật ký Audit', href: '/settings/audit-log', icon: Activity, allowedRoles: ['ADMIN'], permissionKey: 'settings.read' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [perms, setPerms] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    const userId = session?.user?.id
    const cached = readPermCache(userId)
    if (cached) {
      queueMicrotask(() => {
        setPerms(new Set(cached))
        setLoaded(true)
      })
    }
    
    // Always fetch latest to prevent stale sessionStorage
    fetch('/api/me/permissions')
      .then(async (r) => {
        if (r.status === 401) { window.location.href = '/login'; return }
        if (!r.ok) return
        const text = await r.text()
        if (!text) return
        try {
          const d = JSON.parse(text)
          if (d.ok && d.data) {
            const list: string[] = d.data.permissions
            queueMicrotask(() => {
              setPerms(new Set(list))
              setLoaded(true)
            })
            if (userId) writePermCache(userId, list)
          }
        } catch (e) { console.error('Sidebar permissions parse error:', e) }
      })
      .catch(console.error)
  }, [session?.user?.id])

  // Auto-close mobile sidebar on navigation
  function handleNavClick() { setIsOpen(false) }

  function has(key?: string) {
    if (!key) return true
    if (!loaded) return true
    return perms.has(key)
  }

  function isGroupActive(group: NavGroup) {
    return group.items.some(
      (item) =>
        (item.exact ? pathname === item.href : (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')))) ||
        (item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/')))
    )
  }

  function isItemActive(item: NavItem) {
    return (
      (item.exact ? pathname === item.href : (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')))) ||
      (item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/')))
    )
  }

  function isChildActive(child: { href: string }) {
    return pathname === child.href || pathname.startsWith(child.href + '/')
  }

  function toggleMenu(name: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-gray-600">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar panel */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white text-[#191c1e] transform transition-transform duration-300 ease-in-out flex flex-col border-r border-[#e0e3e5] shadow-sm
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Branding */}
        <div className="h-16 flex items-center px-6 font-semibold text-xl tracking-tight border-b border-[#eceef0] shrink-0">
          <div className="w-8 h-8 bg-[#004ac6] rounded-lg mr-3 flex items-center justify-center shadow-sm">
            <Monitor size={18} className="text-white" />
          </div>
          <span className="text-[#191c1e]">IT Manager</span>
        </div>


        {/* Nav */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-4">
          {NAVIGATION_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => has(item.permissionKey))
            if (visibleItems.length === 0) return null
            const groupActive = isGroupActive(group)

            return (
              <div key={group.label}>
                {/* Group header */}
                {!group.hideHeader && (
                  <div className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold uppercase tracking-wider mb-1 ${
                    groupActive ? 'text-[#004ac6]' : 'text-[#737686]'
                  }`}>
                    <group.icon size={14} />
                    <span>{group.label}</span>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const itemActive = isItemActive(item)
                    const hasChildren = !!item.children
                    const menuOpen = openMenus[item.name]

                    return (
                      <div key={item.href}>
                        <div className="flex items-center">
                          <Link
                            href={item.href}
                            onClick={handleNavClick}
                            className={`flex-1 flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                              itemActive
                                ? 'bg-[#004ac6] text-white font-medium shadow-sm'
                                : 'text-[#434655] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
                            }`}
                          >
                            <Icon className={`mr-3 h-4 w-4 shrink-0 ${itemActive ? 'text-white' : 'text-[#737686]'}`} />
                            <span className="text-[14px]">{item.name}</span>
                          </Link>
                          {hasChildren && (
                            <button
                              onClick={(e) => toggleMenu(item.name, e)}
                              className={`p-1 mr-1 rounded hover:bg-[#eceef0] transition ${itemActive ? 'text-white' : 'text-[#737686]'}`}
                              aria-label="Mở rộng menu"
                            >
                              {menuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          )}
                        </div>

                        {/* Children submenu */}
                        {hasChildren && menuOpen && (
                          <div className="mt-1 ml-4 space-y-0.5">
                            {item.children!.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={handleNavClick}
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                                  isChildActive(child)
                                    ? 'bg-[#e0e3e5] text-[#191c1e] font-medium'
                                    : 'text-[#434655] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
                                }`}
                              >
                                <span className="w-1 h-1 rounded-full bg-current mr-2 opacity-60" />
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>
    </>
  )
}