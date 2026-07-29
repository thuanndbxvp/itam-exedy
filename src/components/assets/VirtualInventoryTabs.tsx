'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Wrench, Archive } from 'lucide-react'

interface Props {
  counts: {
    available: number
    maintenance: number
    archived: number
  }
}

export default function VirtualInventoryTabs({ counts }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('virtual_tab')

  const toggleTab = (tab: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (currentTab === tab) {
      p.delete('virtual_tab')
    } else {
      p.set('virtual_tab', tab)
      p.delete('page') // Reset page on new filter
    }
    router.push(`?${p.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        onClick={() => toggleTab('available')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
          currentTab === 'available'
            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
            : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>Kho khả dụng</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          currentTab === 'available' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
        }`}>
          {counts.available}
        </span>
      </button>

      <button
        onClick={() => toggleTab('maintenance')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
          currentTab === 'maintenance'
            ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
            : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
        }`}
      >
        <Wrench className="w-4 h-4" />
        <span>Đang đi sửa</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          currentTab === 'maintenance' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
        }`}>
          {counts.maintenance}
        </span>
      </button>

      <button
        onClick={() => toggleTab('archived')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
          currentTab === 'archived'
            ? 'bg-slate-600 text-white border-slate-700 shadow-md shadow-slate-500/20'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
      >
        <Archive className="w-4 h-4" />
        <span>Kho thanh lý</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          currentTab === 'archived' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
        }`}>
          {counts.archived}
        </span>
      </button>
    </div>
  )
}
