'use client'

/**
 * JsonDiff — so sánh 2 JSON object (oldValues vs newValues) và render inline diff.
 *
 * Extract từ AssetHistoryTimeline (FieldDiff component) ngày 2026-07-28
 * theo audit-report-features-missing-ui.md A2.
 *
 * Cases:
 * - Cả 2 null/empty → return null
 * - oldValues null → "Tạo mới" (toàn bộ newValues là added)
 * - newValues null → "Xóa" (toàn bộ oldValues là removed)
 * - Cả 2 có → so sánh field-by-field, highlight changes
 *
 * Props: { oldValues: any, newValues: any }
 */

import { ArrowRight, FilePlus2, Trash2 } from 'lucide-react'

const MAX_FIELDS_RENDER = 50

function safeParse(v: unknown): Record<string, unknown> | null {
  if (v == null) return null
  if (typeof v === 'object') return v as Record<string, unknown>
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
  }
  return null
}

function formatValue(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
      try {
        return new Date(v).toLocaleString('vi-VN')
      } catch {
        return v
      }
    }
    return v
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

export interface JsonDiffProps {
  oldValues: Record<string, unknown> | unknown[] | string | number | boolean | null
  newValues: Record<string, unknown> | unknown[] | string | number | boolean | null
  /**
   * Optional: render in compact mode (no padding, smaller font)
   * Default: false
   */
  compact?: boolean
}

export default function JsonDiff({ oldValues, newValues, compact = false }: JsonDiffProps) {
  const oldObj = safeParse(oldValues)
  const newObj = safeParse(newValues)

  if (!oldObj && !newObj) return null

  if (!oldObj && newObj) {
    return (
      <div
        className={`flex items-center gap-2 text-emerald-700 ${
          compact ? 'mt-1 text-xs' : 'mt-2 text-xs'
        }`}
      >
        <FilePlus2 size={14} className="flex-shrink-0" />
        <span className="font-medium">Tạo mới</span>
        <span className="text-gray-500">— {Object.keys(newObj).length} trường</span>
      </div>
    )
  }

  if (oldObj && !newObj) {
    return (
      <div
        className={`flex items-center gap-2 text-red-700 ${
          compact ? 'mt-1 text-xs' : 'mt-2 text-xs'
        }`}
      >
        <Trash2 size={14} className="flex-shrink-0" />
        <span className="font-medium">Đã xóa</span>
      </div>
    )
  }

  const oldV = oldObj as Record<string, unknown>
  const newV = newObj as Record<string, unknown>

  const fields = new Set<string>()
  Object.keys(oldV).forEach((k) => fields.add(k))
  Object.keys(newV).forEach((k) => fields.add(k))

  const changes: Array<{ field: string; oldVal: unknown; newVal: unknown }> = []
  fields.forEach((field) => {
    const oldVal = oldV[field]
    const newVal = newV[field]
    const changed = JSON.stringify(oldVal ?? null) !== JSON.stringify(newVal ?? null)
    if (changed) changes.push({ field, oldVal, newVal })
  })

  if (changes.length === 0) {
    return (
      <div
        className={`text-gray-500 italic ${
          compact ? 'mt-1 text-xs' : 'mt-2 text-xs'
        }`}
      >
        Không có thay đổi rõ rệt.
      </div>
    )
  }

  const visible = changes.slice(0, MAX_FIELDS_RENDER)
  const overflow = changes.length - visible.length

  return (
    <div className={`${compact ? 'mt-1' : 'mt-2'} space-y-1`}>
      {visible.map((c) => (
        <div key={c.field} className="flex items-start gap-2 text-xs">
          <span className="font-mono text-gray-500 min-w-[110px] flex-shrink-0">
            {c.field}
          </span>
          <span className="text-red-600 line-through break-all">
            {formatValue(c.oldVal)}
          </span>
          <ArrowRight size={10} className="text-gray-400 mt-1 flex-shrink-0" />
          <span className="text-emerald-700 break-all">{formatValue(c.newVal)}</span>
        </div>
      ))}
      {overflow > 0 && (
        <p className="text-xs text-gray-400 italic">
          +{overflow} trường thay đổi khác (đã ẩn để gọn)
        </p>
      )}
    </div>
  )
}
