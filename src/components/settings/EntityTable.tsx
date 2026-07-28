'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'

/**
 * Column renderer — function trả React node cho mỗi row.
 * Dùng function thay vì accessor để linh hoạt render icons, badges, custom layout.
 */
export type ColumnDef<T> = {
  /** Key duy nhất. */
  key: string
  /** Header text. */
  label: string
  /** Class thêm cho <th>. */
  thClassName?: string
  /** Class thêm cho <td>. */
  tdClassName?: string
  /** Renderer cho cell. */
  render: (row: T) => React.ReactNode
}

/**
 * Field descriptor cho form trong EntityTable.
 * Dùng cho create/edit modal inline (không phải route riêng).
 */
export type FieldDef =
  | {
      kind: 'text' | 'email' | 'url' | 'tel' | 'number' | 'textarea'
      name: string
      label: string
      required?: boolean
      placeholder?: string
      /** Parse khi submit (vd number → Number(e.target.value)). Mặc định: string. */
      parse?: (v: string) => string | number | boolean | null
      rows?: number
    }
  | {
      kind: 'select'
      name: string
      label: string
      required?: boolean
      options: { value: string; label: string }[]
      placeholder?: string
    }
  | {
      kind: 'checkbox'
      name: string
      label: string
    }

type EmptyValues = Record<string, string | number | boolean | null>

interface EntityTableProps<T extends { id: string }> {
  /** Danh sách rows. */
  rows: T[]
  /** Columns hiển thị trong bảng. */
  columns: ColumnDef<T>[]

  // ── Delete ────────────────────────────────────────────────────────
  /** Endpoint base, VD: `/api/settings/manufacturers`. */
  endpoint: string
  /** Label confirm delete. VD: "Xóa công ty". */
  deleteTitle?: string
  /** Câu hỏi confirm. VD: "Bạn có chắc muốn xóa công ty này?". */
  deleteMessage?: string
  /** Thông báo empty (text hoặc ReactNode để có icon). */
  emptyMessage?: React.ReactNode

  // ── Edit route (optional) ─────────────────────────────────────────
  /** Nếu có: bật nút edit dạng link sang `/endpoint/prefix/${id}`. VD: `/settings/manufacturers`. */
  editHrefBase?: string
  /** Nếu có: edit mở modal inline với form. Nếu không, bỏ luôn nút edit. */
  form?: {
    fields: FieldDef[]
    title: string
    /** Convert row → form values ban đầu (override cho mỗi entity). */
    toFormValues?: (row: T) => EmptyValues
    /** Convert empty form values ban đầu khi tạo mới. */
    emptyFormValues: () => EmptyValues
    /** Label title khi edit (hàm nhận row trả về string). */
    editTitle?: (row: T) => string
  }
  /** Title của list, VD: "Danh sách nhà sản xuất". */
  listTitle?: string
  /** Show button "+ Thêm mới" ở header. Mặc định: chỉ hiện khi có `form`. */
  showAddButton?: boolean
}

/**
 * Generic table cho CRUD settings đơn giản (manufacturer, supplier, location, ...).
 *
 * Phase 1: hỗ trợ list + delete + (optional) inline create/edit modal.
 * Phase 2: có thể thêm pagination, sort, filter.
 *
 * Lưu ý: dùng cho các entity KHÔNG có form đặc biệt (manager picker, color picker…).
 * Với những entity có form phức tạp (Departments với company + manager), vẫn viết component riêng.
 */
export default function EntityTable<T extends { id: string }>({
  rows,
  columns,
  endpoint,
  deleteTitle = 'Xóa',
  deleteMessage = 'Bạn có chắc muốn xóa mục này?',
  emptyMessage = 'Chưa có dữ liệu.',
  editHrefBase,
  form,
  listTitle,
  showAddButton,
}: EntityTableProps<T>) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState<EmptyValues>({})

  const hasForm = !!form
  const showAdd = showAddButton ?? hasForm

  function openCreate() {
    if (!form) return
    setEditId(null)
    setFormValues(form.emptyFormValues())
    setShowForm(true)
  }

  function openEdit(row: T) {
    if (!form) return
    setEditId(row.id)
    const base = form.toFormValues ? form.toFormValues(row) : ({ id: row.id } as EmptyValues)
    setFormValues(base)
    setShowForm(true)
  }

  async function handleSubmit() {
    if (!form) return
    setSaving(true)
    try {
      const url = editId ? `${endpoint}/${editId}` : endpoint
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setShowForm(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setDeleteId(null)
        router.refresh()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {(listTitle || showAdd) && (
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            {listTitle && <h2 className="font-semibold text-gray-800">{listTitle}</h2>}
            {showAdd && (
              <button
                type="button"
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
              >
                <Plus size={16} />
                Thêm mới
              </button>
            )}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{emptyMessage}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase ${c.thClassName ?? ''}`}
                  >
                    {c.label}
                  </th>
                ))}
                {(editHrefBase || form || true) && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-6 py-4 ${c.tdClassName ?? 'text-sm text-gray-700'}`}>
                      {c.render(row)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editHrefBase && (
                        <a
                          href={`${editHrefBase}/${row.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          aria-label="Sửa"
                        >
                          <Pencil size={16} />
                        </a>
                      )}
                      {form && !editHrefBase && (
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          aria-label="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteId(row.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        aria-label="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={deleteTitle}
        message={deleteMessage}
        loading={deleting}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />

      {form && (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={
            editId
              ? form.editTitle
                ? form.editTitle(rows.find((r) => r.id === editId) as T)
                : 'Cập nhật'
              : form.title
          }
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.fields.map((field) => (
                <FieldInput
                  key={field.name}
                  field={field}
                  value={formValues[field.name] ?? ''}
                  onChange={(v) => setFormValues((s) => ({ ...s, [field.name]: v }))}
                />
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: string | number | boolean | null
  onChange: (v: string | number | boolean | null) => void
}) {
  const labelEl = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label}
      {'required' in field && field.required && <span className="text-red-500"> *</span>}
    </label>
  )

  if (field.kind === 'select') {
    return (
      <div>
        {labelEl}
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer"
        >
          {field.placeholder !== undefined && <option value="">{field.placeholder}</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.kind === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={field.name}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor={field.name} className="text-sm text-gray-700">
          {field.label}
        </label>
      </div>
    )
  }

  if (field.kind === 'textarea') {
    return (
      <div>
        {labelEl}
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows ?? 3}
          placeholder={field.placeholder}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-none"
        />
      </div>
    )
  }

  return (
    <div>
      {labelEl}
      <input
        type={field.kind}
        value={String(value ?? '')}
        onChange={(e) => {
          const raw = e.target.value
          const next = field.parse ? field.parse(raw) : raw
          onChange(next)
        }}
        placeholder={field.placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
      />
    </div>
  )
}