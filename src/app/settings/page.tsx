'use client'

import Link from 'next/link'
import { 
  Settings, Palette, Shield, Users, Tag, FolderOpen, Box, Factory, 
  Package, MapPin, TrendingDown, Mail, ScrollText, Building2, Network,
  LayoutGrid, Briefcase, MapIcon, Server, Activity, KeyRound
} from 'lucide-react'

type IconKey = React.ElementType

interface SettingItem {
  label: string
  description: string
  href: string
  icon: IconKey
}

interface SettingGroup {
  title: string
  description: string
  icon: IconKey
  accent: 'blue' | 'indigo' | 'emerald' | 'amber'
  items: SettingItem[]
}

const ACCENT_STYLES: Record<SettingGroup['accent'], { bg: string; ring: string; text: string; chip: string }> = {
  blue:   { bg: 'bg-blue-50',   ring: 'hover:border-blue-300',   text: 'text-blue-700',   chip: 'bg-blue-100 text-blue-700' },
  indigo: { bg: 'bg-indigo-50', ring: 'hover:border-indigo-300', text: 'text-indigo-700', chip: 'bg-indigo-100 text-indigo-700' },
  emerald:{ bg: 'bg-emerald-50',ring: 'hover:border-emerald-300',text: 'text-emerald-700',chip: 'bg-emerald-100 text-emerald-700' },
  amber:  { bg: 'bg-amber-50',  ring: 'hover:border-amber-300',  text: 'text-amber-700',  chip: 'bg-amber-100 text-amber-700' },
}

const SETTINGS_GROUPS: SettingGroup[] = [
  {
    title: 'Tổ chức & Nhân sự',
    description: 'Quản lý cơ cấu tổ chức, công ty, phòng ban và người dùng',
    icon: Briefcase,
    accent: 'indigo',
    items: [
      { label: 'Công ty',     description: 'Danh sách công ty trong hệ thống', href: '/settings/companies', icon: Building2 },
      { label: 'Phòng ban',   description: 'Phòng ban, trưởng phòng và nhân viên', href: '/settings/departments', icon: Network },
      { label: 'Người dùng',  description: 'Tài khoản và phân quyền', href: '/settings/users', icon: Users },
    ],
  },
  {
    title: 'Danh mục Tài sản',
    description: 'Phân loại, model, nhà sản xuất và nhà cung cấp',
    icon: LayoutGrid,
    accent: 'emerald',
    items: [
      { label: 'Trạng thái',     description: 'Trạng thái tài sản (đang dùng, sửa chữa…)', href: '/settings/statuses',     icon: Tag },
      { label: 'Danh mục',       description: 'Phân loại tài sản và phần mềm',              href: '/settings/categories',   icon: FolderOpen },
      { label: 'Model thiết bị', description: 'Các dòng máy (model)',                         href: '/settings/asset-models', icon: Box },
      { label: 'Nhà sản xuất',   description: 'Hãng sản xuất',                                href: '/settings/manufacturers', icon: Factory },
      { label: 'Nhà cung cấp',   description: 'Đơn vị cung cấp thiết bị/dịch vụ',             href: '/settings/suppliers',     icon: Package },
      { label: 'Vị trí',         description: 'Chi nhánh, địa điểm',                          href: '/settings/locations',     icon: MapPin },
      { label: 'Khấu hao',       description: 'Cấu hình tính khấu hao',                       href: '/settings/depreciation',  icon: TrendingDown },
    ],
  },
  {
    title: 'Hệ thống',
    description: 'Cấu hình tổng quan, bảo mật, thông báo và phân quyền',
    icon: Server,
    accent: 'blue',
    items: [
      { label: 'Tổng quan',   description: 'Cài đặt chung của hệ thống', href: '/settings/general',  icon: Settings },
      { label: 'Thương hiệu', description: 'Logo, màu sắc, giao diện',    href: '/settings/branding', icon: Palette },
      { label: 'Bảo mật',     description: 'Mật khẩu, 2FA, phiên đăng nhập', href: '/settings/security', icon: Shield },
      { label: 'Email',       description: 'SMTP và mẫu email thông báo', href: '/settings/email',    icon: Mail },
      { label: 'Phân quyền (RBAC)', description: 'Quản lý role và quyền chi tiết', href: '/settings/permissions', icon: KeyRound },
      { label: 'Quản trị Helpdesk', description: 'Quy tắc phân luồng và gán vé tự động', href: '/admin/helpdesk', icon: Settings },
    ],
  },
  {
    title: 'Hoạt động',
    description: 'Theo dõi nhật ký thao tác trên hệ thống',
    icon: Activity,
    accent: 'amber',
    items: [
      { label: 'Nhật ký', description: 'Audit log mọi thao tác', href: '/settings/audit-log', icon: ScrollText },
    ],
  },
]

export default function SettingsHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cài đặt Hệ thống</h1>
          <p className="text-gray-500 mt-1.5 text-base">
            Quản lý toàn bộ cấu hình, danh mục và tùy chọn cho IT Asset Management.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {SETTINGS_GROUPS.map((group) => {
          const GroupIcon = group.icon
          const accent = ACCENT_STYLES[group.accent]
          return (
            <section key={group.title}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg ${accent.bg} flex items-center justify-center shrink-0`}>
                  <GroupIcon size={20} className={accent.text} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{group.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-0 sm:pl-13">
                {group.items.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex flex-col p-5 bg-white border border-gray-200 rounded-xl ${accent.ring} hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <ItemIcon size={18} className={accent.text} />
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-900 transition-colors">
                          {item.label}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
