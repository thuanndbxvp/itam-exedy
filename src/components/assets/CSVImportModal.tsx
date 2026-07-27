'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Upload, FileSpreadsheet, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface CSVImportModalProps {
  onClose: () => void
}

export default function CSVImportModal({ onClose }: CSVImportModalProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][]; total: number } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setPreviewError('Chỉ chấp nhận file CSV.')
      setSelectedFile(null)
      setPreview(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPreviewError('File vượt quá 5MB.')
      setSelectedFile(null)
      setPreview(null)
      return
    }

    setSelectedFile(file)
    setPreviewError(null)

    // Preview parse
    file.text().then((text) => {
      const lines = text.split('\n').filter((l) => l.trim()).slice(0, 6)
      if (lines.length < 2) {
        setPreviewError('File CSV phải có header và ít nhất 1 row.')
        setPreview(null)
        return
      }
      const headers = lines[0].split(',').map((h) => h.trim())
      const rows = lines.slice(1, 5).map((line) => line.split(',').map((v) => v.trim()))
      const total = text.split('\n').filter((l) => l.trim()).length - 1
      setPreview({ headers, rows, total })
    })
  }

  async function handleImport() {
    if (!selectedFile) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch('/api/assets/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.ok) {
        const { success, failed } = data.data
        showCommandResult(
          data,
          `Đã import ${success}/${data.data.total} tài sản.${failed > 0 ? ` ${failed} thất bại.` : ''}`
        )
        onClose()
        router.refresh()
      } else {
        showCommandResult(data)
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Import CSV</h2>
              <p className="text-xs text-gray-500">Upload file CSV để tạo nhiều tài sản cùng lúc.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* File upload area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
              previewError
                ? 'border-red-300 bg-red-50'
                : selectedFile
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {selectedFile ? selectedFile.name : 'Click để chọn file CSV'}
            </p>
            {selectedFile && (
              <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            )}
          </div>

          {/* Preview error */}
          {previewError && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="text-sm">{previewError}</p>
            </div>
          )}

          {/* Preview table */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle size={16} className="shrink-0" />
                <p className="text-sm font-medium">{preview.total} rows sẽ được import.</p>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50 border-b border-gray-200 font-medium">Preview (5 rows đầu):</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        {preview.headers.map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-xs truncate">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Format hint */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-600 mb-1">Định dạng CSV:</p>
            <code className="text-xs text-gray-500 block overflow-x-auto">assetTag,name,serial,model,category,notes</code>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
            Hủy
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isUploading || !!previewError}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <><Loader2 size={16} className="animate-spin" /> Đang import...</>
            ) : (
              <><Upload size={16} /> Import CSV</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
