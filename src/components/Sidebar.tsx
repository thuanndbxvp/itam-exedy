'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Monitor, Key, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'
import RoleGate from './RoleGate'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tài sản (Assets)', href: '/assets', icon: Monitor },
  { name: 'Bản quyền (Licenses)', href: '/licenses', icon: Key },
  { name: 'Cài đặt (Settings)', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

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
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            // Epic D: chỉ ADMIN mới thấy /settings. EMPLOYEE thấy Dashboard/Assets/Licenses.
            const itemRoles: ('ADMIN' | 'EMPLOYEE')[] =
              item.href === '/settings' ? ['ADMIN'] : ['ADMIN', 'EMPLOYEE']
            return (
              <RoleGate key={item.name} allowedRoles={itemRoles}>
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
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              </RoleGate>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
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
