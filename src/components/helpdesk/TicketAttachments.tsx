'use client'

/**
 * TicketAttachments — Sprint C2.
 *
 * Component hiển thị + upload attachments trên ticket detail page.
 *
 * Features:
 *  - Drop zone / file picker (max 10MB)
 *  - List files with filename + size + uploader + delete button
 *  - Permission: chỉ uploader hoặc IT side thấy nút xóa
 */

import { useState, useRef, useEffect } from 'react'
import { Paperclip, Upload, X, Loader2, FileText, ImageIcon, Download } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useSession } from 'next-auth/react'

interface Attachment {
  id: string
  filename: string
  storedPath: string
  mimeType: string
  size: number
  createdAt: string
  uploader: { id: string; firstName: string; lastName: string | null }
}

interface Props {
  ticketId: string
}

export default function TicketAttachments({ ticketId }: Props) {
  const { data: session } = useSession()
  const { showCommandResult } = useToast()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) setAttachments(json.data.attachments)
    } finally {
      setLoading(false)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    let success = 0
    let failed = 0
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
          method: 'POST',
          body: fd,
        })
        const json = await res.json()
        if (json.ok) {
          success++
        } else {
          failed++
          showCommandResult({
            ok: false,
            code: json.code ?? 'UPLOAD',
            message: `${file.name}: ${json.message ?? 'lỗi'}`,
          })
        }
      } catch {
        failed++
      }
    }
    setUploading(false)
    if (success > 0) {
      showCommandResult({
        ok: true,
        code: 'OK',
        message: `Upload ${success} file${success > 1 ? 's' : ''}.${failed > 0 ? ` (${failed} thất bại)` : ''}`,
      })
      await load()
    }
  }

  async function handleDelete(att: Attachment) {
    if (!confirm(`Xóa file "${att.filename}"?`)) return
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attachmentId: att.id }),
      })
      const json = await res.json()
      if (json.ok) {
        showCommandResult(json, 'Đã xóa file.')
        await load()
      } else {
        showCommandResult(json)
      }
    } catch (e) {
      showCommandResult({ ok: false, code: 'NETWORK', message: 'Lỗi kết nối.' })
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  function fileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return <ImageIcon size={16} className="text-blue-500" />
    return <FileText size={16} className="text-gray-500" />
  }

  function canDelete(att: Attachment): boolean {
    if (!session?.user) return false
    if (att.uploader.id === session.user.id) return true
    const role = session.user.role
    return role === 'ADMIN' || role === 'IT_MANAGER' || role === 'IT_STAFF'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Paperclip size={16} className="text-gray-500" />
        <h3 className="font-semibold text-gray-900">File đính kèm</h3>
        <span className="text-xs text-gray-500">({attachments.length})</span>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <Loader2 size={16} className="animate-spin" />
            Đang upload...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Upload size={16} />
            Bấm hoặc kéo thả file (tối đa 10MB)
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          PNG, JPEG, WebP, PDF, TXT, DOC, DOCX
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,text/plain,.doc,.docx"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="mt-3 flex items-center justify-center text-sm text-gray-500 py-4">
          <Loader2 size={14} className="animate-spin mr-2" /> Đang tải...
        </div>
      ) : attachments.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400 text-center py-3">Chưa có file nào.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
            >
              {fileIcon(att.mimeType)}
              <div className="flex-1 min-w-0">
                <a
                  href={att.storedPath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate flex items-center gap-1"
                  title={att.filename}
                >
                  {att.filename}
                  <Download size={12} className="opacity-50" />
                </a>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatSize(att.size)} ·{' '}
                  {att.uploader.firstName} {att.uploader.lastName ?? ''} ·{' '}
                  {new Date(att.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
              {canDelete(att) && (
                <button
                  type="button"
                  onClick={() => handleDelete(att)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Xóa file"
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
