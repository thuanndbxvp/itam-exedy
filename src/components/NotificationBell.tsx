'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check } from 'lucide-react'

interface NotificationItem {
  id: string
  kind: string
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: string
  ticketId: string | null
}

const POLL_MS = 30_000

/**
 * Notification bell trên header — Epic F.
 *
 * Polling /api/notifications?count=1 mỗi 30s để lấy số unread.
 * Click → mở dropdown list 10 gần nhất.
 * Click 1 notification → mark as read + navigate tới link.
 */
export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function refresh() {
    try {
      const r = await fetch('/api/notifications?limit=10', { cache: 'no-store' })
      const json = await r.json()
      if (json.ok) {
        setItems(json.data.notifications)
        setCount(json.data.notifications.filter((n: NotificationItem) => !n.isRead).length)
      }
    } catch {
      // ignore — bell poll failures shouldn't break UI
    }
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, POLL_MS)
    return () => clearInterval(t)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Refresh khi router focus lại (vd: user quay về từ detail page)
  useEffect(() => {
    function onFocus() {
      refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function handleClickItem(item: NotificationItem) {
    if (!item.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: item.id }),
        })
      } catch {
        // ignore
      }
    }
    setOpen(false)
    setCount((c) => Math.max(0, c - (item.isRead ? 0 : 1)))
    if (item.link) router.push(item.link)
  }

  async function handleMarkAllRead() {
    setLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={`Thông báo (${count} chưa đọc)`}
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[28rem] overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 z-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
              >
                <Check size={12} /> Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Chưa có thông báo nào
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleClickItem(item)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                        item.isRead ? '' : 'bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!item.isRead && (
                          <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${item.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'} truncate`}>
                            {item.title}
                          </p>
                          {item.body && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.body}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}