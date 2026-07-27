'use client'

import { useState, useRef } from 'react'
import { useToast } from '@/components/Toast'
import { Image as ImageIcon, X, Loader2, Upload } from 'lucide-react'
import { uploadFile } from '@/lib/upload'

/**
 * AssetImagePicker — Client Component cho phép admin upload ảnh asset.
 *
 * AssetForm là Server Action, nên ta cần wrapper client để:
 *  1. Mở file picker
 *  2. Encode file thành base64 data-URI (stub MVP, xem /lib/upload.ts)
 *  3. Set giá trị vào hidden input để server action nhận được
 *
 * Khi Epic I (S3/Blob) xong: chỉ cần đổi implementation, không phải sửa form.
 */
export default function AssetImagePicker({
  entityId,
  initialImage,
}: {
  entityId: string
  initialImage: string | null
}) {
  const { showCommandResult } = useToast()
  const [image, setImage] = useState<string | null>(initialImage)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const result = await uploadFile({ file, type: 'asset-image', entityId })
      if (!result.ok || !result.url) {
        showCommandResult({ ok: false, code: 'UPLOAD', message: result.error ?? 'Upload lỗi.' })
        return
      }
      setImage(result.url)
      showCommandResult({ ok: true, code: 'OK', message: 'Đã upload ảnh.' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) void handleFile(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  function clear() {
    setImage(null)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Hình ảnh thiết bị</label>

      {/* Hidden input để server action nhận giá trị */}
      <input type="hidden" name="image" value={image ?? ''} />

      {/* Preview */}
      {image ? (
        <div className="relative w-full h-40 bg-slate-100 rounded-xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="asset preview" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 p-1 bg-white/90 rounded-full hover:bg-white text-red-600 shadow-sm"
            title="Xóa ảnh"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full h-40 bg-slate-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
        >
          <ImageIcon size={36} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-600">Click hoặc kéo thả ảnh vào đây</p>
          <p className="text-xs text-gray-400 mt-1">PNG / JPEG / WebP, tối đa 5MB</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {image ? 'Đổi ảnh' : 'Chọn ảnh'}
        </button>
        {image && (
          <button
            type="button"
            onClick={clear}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            <X size={14} />
            Xóa ảnh
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
