'use client'

/**
 * LicenseHistoryTimeline — tab Lịch sử cấp phát license.
 *
 * Fetch /api/licenses/[id]/history, render timeline lịch sử thao tác:
 *   - CHECKOUT / CHECKIN (cấp phát / thu hồi seat)
 *   - UPDATE (sửa thông tin license)
 *   - CREATE
 */

import { useEffect, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  CornerDownLeft,
  CornerUpRight,
  Edit3,
  FilePlus2,
  Trash2,
  RefreshCcw,
  ClipboardCheck,
  MessageSquarePlus,
  Clock,
} from 'lucide-react'
import JsonDiff from '@/components/audit/JsonDiff'

interface HistoryEvent {
  id: string
  actionType:
    | 'CREATE'
    | 'UPDATE'
    | 'CHECKOUT'
    | 'CHECKIN'
    | 'AUDIT'
    | 'DELETE'
    | 'RESTORE'
    | 'NOTE_ADDED'
    | 'ACCEPTED'
    | 'DECLINED'
  itemType: string
  notes: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  createdAt: string
  actor: {
    id: string
    firstName: string
    lastName: string | null
    email: string | null
  }
}

const ACTION_META: Record<
  HistoryEvent['actionType'],
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  CREATE: { icon: <FilePlus2 size={16} />, label: 'Tạo mới', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  UPDATE: { icon: <Edit3 size={16} />, label: 'Cập nhật', color: 'text-amber-700', bg: 'bg-amber-100' },
  CHECKOUT: { icon: <CornerUpRight size={16} />, label: 'Cấp phát', color: 'text-blue-700', bg: 'bg-blue-100' },
  CHECKIN: { icon: <CornerDownLeft size={16} />, label: 'Thu hồi', color: 'text-slate-700', bg: 'bg-slate-100' },
  AUDIT: { icon: <ClipboardCheck size={16} />, label: 'Kiểm kê', color: 'text-purple-700', bg: 'bg-purple-100' },
  DELETE: { icon: <Trash2 size={16} />, label: 'Xóa', color: 'text-red-700', bg: 'bg-red-100' },
  RESTORE: { icon: <RefreshCcw size={16} />, label: 'Khôi phục', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  NOTE_ADDED: { icon: <MessageSquarePlus size={16} />, label: 'Ghi chú', color: 'text-gray-700', bg: 'bg-gray-100' },
  ACCEPTED: { icon: <CheckCircle2 size={16} />, label: 'Chấp nhận', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  DECLINED: { icon: <CheckCircle2 size={16} />, label: 'Từ chối', color: 'text-red-700', bg: 'bg-red-100' },
}

function formatActorName(actor: HistoryEvent['actor']): string {
  const full = [actor.firstName, actor.lastName].filter(Boolean).join(' ')
  return full || actor.email || 'Hệ thống'
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'vừa xong'
  if (min < 60) return `${min} phút trước`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} giờ trước`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} ngày trước`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} tháng trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export default function LicenseHistoryTimeline({ licenseId }: { licenseId: string }) {
  const [events, setEvents] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/licenses/${licenseId}/history`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setEvents(j.data.events)
        else setError(j?.message ?? 'Không thể tải lịch sử.')
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [licenseId])

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-pulse" />
        Đang tải lịch sử…
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
        Lỗi: {error}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        Chưa có lịch sử thao tác nào trên license này.
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-4">
        {events.map((evt) => {
          const meta = ACTION_META[evt.actionType] ?? ACTION_META.UPDATE
          return (
            <div key={evt.id} className="flex gap-3 relative">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full ${meta.bg} ${meta.color} flex items-center justify-center shadow-sm z-10`}
              >
                {meta.icon}
              </div>

              <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatActorName(evt.actor)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                      {evt.itemType}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {relativeTime(evt.createdAt)} ·{' '}
                    <span className="text-gray-400">
                      {new Date(evt.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </span>
                </div>

                {evt.notes && (
                  <p className="text-sm text-gray-600 mt-2 italic">"{evt.notes}"</p>
                )}

                <JsonDiff oldValues={evt.oldValues} newValues={evt.newValues} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
