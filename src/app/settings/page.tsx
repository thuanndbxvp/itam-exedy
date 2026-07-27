import Link from 'next/link'
import { 
  Settings, Palette, Shield, Building2, Users, Tag, FolderOpen, 
  Box, Factory, Package, MapPin, TrendingDown, Mail, ScrollText 
} from 'lucide-react'

const SETTINGS_CATEGORIES = [
  { label: 'Tổng quan', description: 'Cài đặt chung cho hệ thống', href: '/settings/general', icon: Settings },
  { label: 'Thương hiệu', description: 'Logo, màu sắc và giao diện', href: '/settings/branding', icon: Palette },
  { label: 'Bảo mật', description: 'Chính sách mật khẩu, 2FA', href: '/settings/security', icon: Shield },
  { label: 'Công ty', description: 'Quản lý thông tin các công ty', href: '/settings/companies', icon: Building2 },
  { label: 'Người dùng', description: 'Quản lý tài khoản và phân quyền', href: '/settings/users', icon: Users },
  { label: 'Trạng thái', description: 'Trạng thái của tài sản', href: '/settings/statuses', icon: Tag },
  { label: 'Danh mục', description: 'Phân loại tài sản và phần mềm', href: '/settings/categories', icon: FolderOpen },
  { label: 'Model thiết bị', description: 'Quản lý các dòng máy (Model)', href: '/settings/asset-models', icon: Box },
  { label: 'Nhà sản xuất', description: 'Quản lý hãng sản xuất', href: '/settings/manufacturers', icon: Factory },
  { label: 'Nhà cung cấp', description: 'Đơn vị cung cấp dịch vụ/thiết bị', href: '/settings/suppliers', icon: Package },
  { label: 'Vị trí', description: 'Quản lý các địa điểm, chi nhánh', href: '/settings/locations', icon: MapPin },
  { label: 'Khấu hao', description: 'Cài đặt tính toán khấu hao', href: '/settings/depreciation', icon: TrendingDown },
  { label: 'Email', description: 'Cấu hình SMTP và mẫu email', href: '/settings/email', icon: Mail },
  { label: 'Nhật ký', description: 'Xem nhật ký hoạt động (Audit log)', href: '/settings/audit-log', icon: ScrollText },
]

export default function SettingsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cài đặt Hệ thống</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Quản lý toàn bộ cấu hình, danh mục và tùy chọn cho IT Asset Management.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {SETTINGS_CATEGORIES.map((category) => {
          const Icon = category.icon
          return (
            <Link
              key={category.href}
              href={category.href}
              className="group flex flex-col p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Icon className="text-blue-600" size={20} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {category.label}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {category.description}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
