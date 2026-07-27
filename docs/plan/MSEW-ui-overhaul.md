# MICRO-STEP EXECUTION WORKFLOW (MSEW): UI OVERHAUL

Yêu cầu Tầng 2 (Coder) thực hiện chính xác các bước dưới đây.

## BƯỚC 1: Cài đặt thư viện Icon
Mở terminal và chạy lệnh:
```bash
npm install lucide-react
```

## BƯỚC 2: Tạo Layout Components
Tạo file `src/components/Sidebar.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Monitor, Key, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tài sản', href: '/assets', icon: Monitor },
  { name: 'Bản quyền', href: '/licenses', icon: Key },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-slate-800">
        <Monitor size={18} className="mr-3 text-blue-500" /> IT Manager
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.name} href={item.href} className={`flex items-center px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="mr-3 h-5 w-5" /> <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

Tạo file `src/components/Header.tsx`:
```tsx
'use client'
import { Search, Bell } from 'lucide-react'

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="text-xl font-bold text-gray-800">Quản trị Hệ thống</div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-2 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm..." className="pl-9 pr-4 py-1.5 bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button className="text-gray-400 hover:text-gray-600"><Bell size={20} /></button>
      </div>
    </header>
  )
}
```

## BƯỚC 3: Cập nhật App Layout
Sửa file `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "IT Asset Manager" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full bg-gray-50`}>
      <body className="h-full flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

## BƯỚC 4: Tạo Dashboard
Tạo file `src/app/page.tsx`:
```tsx
import prisma from '@/lib/prisma'
import { Monitor, CheckCircle, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const [total, deployed, broken] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { statusId: 'status-deployed' } }),
    prisma.asset.count({ where: { statusId: 'status-broken' } })
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-100 rounded-xl mr-4"><Monitor className="text-blue-600" /></div>
          <div><p className="text-gray-500 text-sm">Tổng Tài Sản</p><p className="text-3xl font-bold">{total}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-100 rounded-xl mr-4"><CheckCircle className="text-green-600" /></div>
          <div><p className="text-gray-500 text-sm">Đang Sử Dụng</p><p className="text-3xl font-bold">{deployed}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-100 rounded-xl mr-4"><AlertTriangle className="text-red-600" /></div>
          <div><p className="text-gray-500 text-sm">Báo Hỏng</p><p className="text-3xl font-bold">{broken}</p></div>
        </div>
      </div>
    </div>
  )
}
```
*(Ghi chú cho Tầng 2: Áp dụng form design và list design tương tự cho `/assets/page.tsx` và `/assets/new/page.tsx` với style Tailwind cao cấp: `rounded-2xl`, `shadow-sm`, `focus:ring-2`).*
