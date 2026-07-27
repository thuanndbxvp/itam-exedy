// Disable the rule for legitimate data-load effects in this file.
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

/**
 * IntegrationsClient — Sprint C7-C9 admin UI.
 *
 * Quản lý:
 *  - API Tokens (C7): create + list + revoke.
 *  - Email Templates (C8): edit + preview.
 *  - Notification Channels (C9): create + test + delete Slack webhooks.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Key,
  Mail,
  Bell,
  Plus,
  Trash2,
  TestTube,
  Copy,
  Check,
  Save,
  Eye,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/components/Toast'

type Tab = 'tokens' | 'templates' | 'channels'

interface ApiToken {
  id: string
  name: string
  tokenPrefix: string
  scopes: string[]
  expiresAt: string | null
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
  ownerName: string
}

interface EmailTemplate {
  key: string
  subject: string
  htmlBody: string
  variables: string[]
  updatedAt?: string
}

interface NotificationChannel {
  id: string
  name: string
  kind: string
  enabled: boolean
  filterKinds: string[]
  lastDeliveryAt: string | null
  lastDeliveryError: string | null
  createdAt: string
}

const TAB_LABELS: Record<Tab, { label: string; icon: typeof Key }> = {
  tokens: { label: 'API Tokens', icon: Key },
  templates: { label: 'Email Templates', icon: Mail },
  channels: { label: 'Notification Channels', icon: Bell },
}

const SAMPLE_VARS: Record<string, Record<string, string>> = {
  TICKET_ASSIGNED: {
    recipientName: 'Nguyễn Văn A',
    ticketCode: 'TK-001',
    link: 'https://app.example.com/helpdesk/TK-001',
  },
  TICKET_COMMENTED: {
    recipientName: 'Nguyễn Văn A',
    ticketCode: 'TK-002',
    authorName: 'Trần Thị B',
    commentContent: 'Đã kiểm tra xong, vui lòng reboot máy.',
    link: 'https://app.example.com/helpdesk/TK-002',
  },
  TICKET_STATUS_CHANGED: {
    recipientName: 'Nguyễn Văn A',
    ticketCode: 'TK-003',
    newStatus: 'IN_PROGRESS',
    link: 'https://app.example.com/helpdesk/TK-003',
  },
  TICKET_CLOSED: {
    recipientName: 'Nguyễn Văn A',
    ticketCode: 'TK-004',
    link: 'https://app.example.com/helpdesk/TK-004',
  },
  PASSWORD_RESET: {
    userName: 'Nguyễn Văn A',
    resetUrl: 'https://app.example.com/reset-password?token=abc123',
  },
  ASSET_CHECKOUT: {
    userName: 'Nguyễn Văn A',
    assetTag: 'IT-0001',
    assetName: 'Laptop Dell Latitude 5420',
    notes: 'Cấp phát cho dự án CRM',
    link: 'https://app.example.com/assets/IT-0001',
  },
}

export default function IntegrationsClient() {
  const [tab, setTab] = useState<Tab>('tokens')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} className="mr-1" /> Quay lại Settings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Integrations</h1>
      <p className="text-sm text-gray-500 mb-6">
        Quản lý API tokens, email templates, và notification channels cho tích hợp ngoài.
      </p>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex items-center gap-1">
        {(Object.keys(TAB_LABELS) as Tab[]).map((k) => {
          const Icon = TAB_LABELS[k].icon
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === k
                  ? 'border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={14} />
              {TAB_LABELS[k].label}
            </button>
          )
        })}
      </div>

      {tab === 'tokens' && <TokensTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'channels' && <ChannelsTab />}
    </div>
  )
}

// ============================================================================
// C7: API Tokens Tab
// ============================================================================
function TokensTab() {
  const { showCommandResult } = useToast()
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['assets.read'])
  const [creating, setCreating] = useState(false)
  const [newRawToken, setNewRawToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const SCOPE_OPTIONS = ['assets.read', 'licenses.read', 'users.read', 'tickets.read']

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/api-tokens', { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) setTokens(json.data.tokens)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), scopes: selectedScopes }),
      })
      const json = await res.json()
      if (json.ok) {
        showCommandResult(json, 'Đã tạo token.')
        setNewRawToken(json.data.token.rawToken)
        setShowCreate(false)
        setNewName('')
        await load()
      } else {
        showCommandResult(json)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string, name: string) {
    if (!confirm(`Thu hồi token "${name}"? Token sẽ không dùng được nữa.`)) return
    try {
      const res = await fetch(`/api/api-tokens/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) {
        showCommandResult(json, 'Đã thu hồi.')
        await load()
      } else {
        showCommandResult(json)
      }
    } catch {
      showCommandResult({
        ok: false,
        code: 'NETWORK',
        message: 'Lỗi kết nối.',
      })
    }
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  function copyToken() {
    if (!newRawToken) return
    navigator.clipboard.writeText(newRawToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          API tokens cho phép hệ thống ngoài truy cập API với Bearer authentication.
          Token chỉ hiển thị 1 lần khi tạo.
        </p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-1"
        >
          <Plus size={14} /> Tạo token
        </button>
      </div>

      {newRawToken && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-900 mb-2">
            ⚠️ Token mới — chỉ hiển thị MỘT LẦN duy nhất. Hãy copy ngay!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded border border-amber-300 text-xs font-mono break-all">
              {newRawToken}
            </code>
            <button
              type="button"
              onClick={copyToken}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm inline-flex items-center gap-1"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Đã copy' : 'Copy'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewRawToken(null)}
            className="text-xs text-amber-700 hover:underline mt-2"
          >
            Tôi đã lưu token rồi, ẩn đi.
          </button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Tạo API token mới</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên token (vd: HR sync job)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Scopes</p>
              <div className="space-y-1">
                {SCOPE_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(s)}
                      onChange={() => toggleScope(s)}
                      className="rounded text-blue-600"
                    />
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{s}</code>
                  </label>
                ))}
              </div>
            </div>
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
                disabled={creating || !newName.trim() || selectedScopes.length === 0}
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
      ) : tokens.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Chưa có token.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
              <tr>
                <th className="text-left px-3 py-2">Tên</th>
                <th className="text-left px-3 py-2">Prefix</th>
                <th className="text-left px-3 py-2">Scopes</th>
                <th className="text-left px-3 py-2">Dùng cuối</th>
                <th className="text-left px-3 py-2">Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{t.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">tk_{t.tokenPrefix}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {t.scopes.map((s) => (
                        <code
                          key={s}
                          className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                        >
                          {s}
                        </code>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString('vi-VN') : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {t.revokedAt ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        Đã thu hồi
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                        Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!t.revokedAt && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(t.id, t.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Thu hồi"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// C8: Email Templates Tab
// ============================================================================
function TemplatesTab() {
  const { showCommandResult } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [formSubject, setFormSubject] = useState('')
  const [formBody, setFormBody] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/email-templates', { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) setTemplates(json.data.templates)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(t: EmailTemplate) {
    setEditingKey(t.key)
    setFormSubject(t.subject)
    setFormBody(t.htmlBody)
    setShowPreview(true)
  }

  async function handleSave() {
    if (!editingKey) return
    setSaving(true)
    try {
      const res = await fetch(`/api/email-templates/${editingKey}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject: formSubject, htmlBody: formBody }),
      })
      const json = await res.json()
      if (json.ok) {
        showCommandResult(json, 'Đã lưu template.')
        setEditingKey(null)
        await load()
      } else {
        showCommandResult(json)
      }
    } finally {
      setSaving(false)
    }
  }

  function renderPreview(tpl: string): string {
    const samples = editingKey ? SAMPLE_VARS[editingKey] ?? {} : {}
    return tpl.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
      const v = samples[key]
      return v === undefined ? `{{${key}}}` : String(v)
    })
  }

  if (loading) {
    return <div className="text-center text-sm text-gray-500 py-8">Đang tải...</div>
  }

  if (editingKey) {
    const tpl = templates.find((t) => t.key === editingKey)
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-1">Sửa template: {editingKey}</h3>
        <p className="text-xs text-gray-500 mb-4">
          Variables có thể dùng: {tpl?.variables.map((v) => <code key={v} className="bg-gray-100 px-1.5 py-0.5 rounded mr-1">{`{{${v}}}`}</code>)}
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          value={formSubject}
          onChange={(e) => setFormSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4"
        />
        <label className="block text-sm font-medium text-gray-700 mb-1">HTML Body</label>
        <textarea
          value={formBody}
          onChange={(e) => setFormBody(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none mb-3"
        />
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="rounded text-blue-600"
            />
            <Eye size={14} /> Preview
          </label>
        </div>
        {showPreview && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Subject preview</p>
            <p className="text-sm text-gray-900 mb-3 font-medium">
              {renderPreview(formSubject)}
            </p>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Body preview</p>
            <div
              className="text-sm bg-white p-3 rounded border"
              dangerouslySetInnerHTML={{ __html: renderPreview(formBody) }}
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditingKey(null)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 inline-flex items-center gap-1"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <Save size={14} /> Lưu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <div
          key={t.key}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-start justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900">{t.key}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">Subject: {t.subject}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {t.variables.slice(0, 4).map((v) => (
                <code
                  key={v}
                  className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded"
                >
                  {`{{${v}}}`}
                </code>
              ))}
              {t.variables.length > 4 && (
                <span className="text-[10px] text-gray-400">
                  +{t.variables.length - 4}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => startEdit(t)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            Sửa
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// C9: Notification Channels Tab
// ============================================================================
function ChannelsTab() {
  const { showCommandResult } = useToast()
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)

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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa channel "${name}"?`)) return
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
                  onClick={() => handleDelete(c.id, c.name)}
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
    </div>
  )
}
