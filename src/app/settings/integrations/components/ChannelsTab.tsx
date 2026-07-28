'use client'

/**
 * ChannelsTab - Notification Channels management (C9)
 * Extracted from IntegrationsClient.tsx - Sprint R.3
 */
import { useState, useEffect } from 'react'
import { Plus, Trash2, TestTube, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/ui/Modal'
import type { NotificationChannel } from '../types'

export function ChannelsTab() {
  const { showCommandResult } = useToast()
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/notification-channels', { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) setChannels(json.data.channels)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/notification-channels', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          kind: 'SLACK',
          url: formUrl.trim(),
          enabled: formEnabled,
          filterKinds: [],
        }),
      })
      const json = await res.json()
      if (json.ok) {
        showCommandResult(json, 'Đã tạo channel.')
        setShowCreate(false)
        setFormName('')
        setFormUrl('')
        await load()
      } else {
        showCommandResult(json)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleTest(id: string) {
    setTestingId(id)
    try {
      const res = await fetch(`/api/notification-channels/${id}/test`, { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        showCommandResult(json, 'Đã gửi test ping!')
        await load()
      } else {
        showCommandResult(json)
      }
    } finally {
      setTestingId(null)
    }
  }

  function handleRequestDelete(id: string, name: string) {
    setConfirmDeleteId(id)
    setConfirmDeleteName(name)
  }

  async function handleConfirmDelete() {
    const id = confirmDeleteId
    if (!id) return
    setConfirmDeleteId(null)
    try {
      const res = await fetch('/api/notification-channels', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.ok) {
        showCommandResult(json, 'Đã xóa.')
        await load()
      } else {
        showCommandResult(json)
      }
    } catch {
      showCommandResult({ ok: false, code: 'NETWORK', message: 'Lỗi kết nối.' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Slack webhook channels nhận thông báo khi có sự kiện (ticket mới, comment, status thay đổi…).
        </p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-1"
        >
          <Plus size={14} /> Tạo channel
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-1">Thêm Slack webhook</h3>
            <p className="text-xs text-gray-500 mb-4">
              Trong Slack: <strong>Incoming Webhooks → Add New → chọn channel → Copy Webhook URL</strong>.
            </p>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Tên channel (vd: Team IT Slack)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <label className="flex items-center gap-2 text-sm mb-4">
              <input
                type="checkbox"
                checked={formEnabled}
                onChange={(e) => setFormEnabled(e.target.checked)}
                className="rounded text-blue-600"
              />
              Kích hoạt
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !formName.trim() || !formUrl.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 inline-flex items-center gap-1"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-gray-500 py-8">Đang tải...</div>
      ) : channels.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Chưa có channel nào.</p>
      ) : (
        <div className="space-y-2">
          {channels.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{c.name}</h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      c.enabled
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {c.enabled ? 'Kích hoạt' : 'Tắt'}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {c.kind}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Delivery cuối:{' '}
                  {c.lastDeliveryAt
                    ? new Date(c.lastDeliveryAt).toLocaleString('vi-VN')
                    : '—'}
                  {c.lastDeliveryError && (
                    <span className="text-red-600 ml-2">{c.lastDeliveryError}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTest(c.id)}
                  disabled={testingId === c.id}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                  title="Test ping"
                >
                  {testingId === c.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <TestTube size={14} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestDelete(c.id, c.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Xóa notification channel"
      >
        <p className="text-gray-600 mb-4">
          Xóa channel <strong>"{confirmDeleteName}"</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmDeleteId(null)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default ChannelsTab
