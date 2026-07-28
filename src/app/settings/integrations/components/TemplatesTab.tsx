'use client'

/**
 * TemplatesTab - Email Templates management (C8)
 * Extracted from IntegrationsClient.tsx - Sprint R.3
 */
import { useState, useEffect } from 'react'
import { Save, Eye, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import type { EmailTemplate } from '../types'
import { SAMPLE_VARS } from '../types'

export function TemplatesTab() {
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

export default TemplatesTab
