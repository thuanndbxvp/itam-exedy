'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Monitor, Key, Settings, Menu, X, LifeBuoy, Inbox,
  Palette, Shield, Building2, Users, Tag, FolderOpen, Box, Factory, 
  Package, MapPin, TrendingDown, Mail, ScrollText, ChevronDown, ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import RoleGate from './RoleGate'

type NavItem = {
  name: string
  href: string
  icon: any
  allowedRoles: ('ADMIN' | 'IT_STAFF' | 'IT_MANAGER' | 'EMPLOYEE')[]
  children?: { label: string; href: string; icon: any }[]
}

const SETTINGS_CHILDREN = [
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

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'] },
  { name: 'Tài sản (Assets)', href: '/assets', icon: Monitor, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'] },
  { name: 'Bản quyền (Licenses)', href: '/licenses', icon: Key, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'] },
  { name: 'Helpdesk', href: '/helpdesk', icon: LifeBuoy, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER', 'EMPLOYEE'] },
  { name: 'Hộp thư IT', href: '/helpdesk/inbox', icon: Inbox, allowedRoles: ['ADMIN', 'IT_STAFF', 'IT_MANAGER'] },
  { name: 'Quản trị Helpdesk', href: '/admin/helpdesk', icon: Settings, allowedRoles: ['ADMIN', 'IT_MANAGER'] },
  { name: 'Cài đặt (Settings)', href: '/settings', icon: Settings, allowedRoles: ['ADMIN'], children: SETTINGS_CHILDREN },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Tự động mở menu nếu đang ở trang con của nó
    const initialOpenMenus: Record<string, boolean> = {}
    navigation.forEach(item => {
      if (item.children && pathname.startsWith(item.href)) {
        initialOpenMenus[item.name] = true
      }
    })
    setOpenMenus(initialOpenMenus)
  }, [pathname])

  const toggleMenu = (name: string, e: React.MouseEvent) => {
    e.preventDefault()
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-gray-600"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
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
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname === item.href)
            const hasChildren = !!item.children
            const isMenuOpen = openMenus[item.name]

            return (
              <RoleGate key={item.name} allowedRoles={item.allowedRoles}>
                <div>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2.5 rounded-lg transition-colors group justify-between
                      ${(isActive || (hasChildren && pathname.startsWith(item.href) && item.href !== '/'))
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={`mr-3 h-5 w-5 ${(isActive || (hasChildren && pathname.startsWith(item.href) && item.href !== '/')) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                      />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {hasChildren && (
                      <button 
                        onClick={(e) => toggleMenu(item.name, e)}
                        className="p-1 rounded-md hover:bg-black/20 transition-colors"
                      >
                        {isMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    )}
                  </Link>

                  {/* Rendering Children */}
                  {hasChildren && isMenuOpen && (
                    <div className="mt-1 space-y-1 pl-10 pr-2">
                      {item.children!.map((child) => {
                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`
                              flex items-center px-3 py-2 rounded-lg transition-colors text-sm
                              ${isChildActive
                                ? 'bg-slate-800 text-white font-medium'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                              }
                            `}
                          >
                            <child.icon className={`mr-2 h-4 w-4 ${isChildActive ? 'text-blue-400' : 'text-slate-500'}`} />
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </RoleGate>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
              AD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin IT</p>
              <p className="text-xs text-slate-400">admin@congty.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
