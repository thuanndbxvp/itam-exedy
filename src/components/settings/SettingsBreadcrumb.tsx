'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function SettingsBreadcrumb() {
  const pathname = usePathname()
  
  // Không hiển thị nút quay lại nếu đang ở trang Hub chính
  if (pathname === '/settings') return null

  return (
    <div className="mb-6">
      <Link 
        href="/settings" 
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ChevronLeft size={16} className="mr-1" />
        Quay lại Trung tâm Cài đặt
      </Link>
    </div>
  )
}
