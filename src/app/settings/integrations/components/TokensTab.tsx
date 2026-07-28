'use client'

/**
 * TokensTab - API Tokens management (C7)
 * Extracted from IntegrationsClient.tsx - Sprint R.3
 */
import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Check, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/ui/Modal'
import type { ApiToken } from '../types'
import { API_TOKEN_SCOPE_OPTIONS } from '../types'

interface Props {
  onTokensChange?: () => void
}

export function TokensTab({ onTokensChange }: Props) {
  const { showCommandResult } = useToast()
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['assets.read'])
  const [creating, setCreating] = useState(false)
  const [newRawToken, setNewRawToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)
  const [confirmRevokeName, setConfirmRevokeName] = useState<string>('')

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
        onTokensChange?.()
      } else {
        showCommandResult(json)
      }
    } finally {
      setCreating(false)
    }
  }

  function handleRequestRevoke(id: string, name: string) {
    setConfirmRevokeId(id)
    setConfirmRevokeName(name)
  }

  async function handleConfirmRevoke() {
    const id = confirmRevokeId
    if (!id) return
    setConfirmRevokeId(null)
    try {
      const res = await fetch(`/api/api-tokens/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) {
        showCommandResult(json, 'Đã thu hồi.')
        await load()
        onTokensChange?.()
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
                {API_TOKEN_SCOPE_OPTIONS.map((s) => (
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
                        onClick={() => handleRequestRevoke(t.id, t.name)}
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

      <Modal
        open={!!confirmRevokeId}
        onClose={() => setConfirmRevokeId(null)}
        title="Thu hồi token"
      >
        <p className="text-gray-600 mb-4">
          Thu hồi token <strong>"{confirmRevokeName}"</strong>? Token sẽ không dùng được nữa.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmRevokeId(null)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmRevoke}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Thu hồi
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default TokensTab
