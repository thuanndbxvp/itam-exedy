'use client'

import { Download } from 'lucide-react'

interface Props {
  /** Query string hiện tại của trang (search, status) để truyền cho API */
  queryString: string
  canExport: boolean
}

/**
 * ExportLicensesButton — Link download CSV từ /api/licenses/export.
 *
 * Truyền kèm queryString hiện tại để CSV export đúng theo filter đang chọn.
 * Dùng thẻ <a download> nên không cần fetch.
 */
export default function ExportLicensesButton({ queryString, canExport }: Props) {
  if (!canExport) return null

  const href = queryString ? `/api/licenses/export?${queryString}` : '/api/licenses/export'

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm text-sm font-medium text-gray-700"
      title="Xuất danh sách license ra CSV"
    >
      <Download size={16} />
      Xuất CSV
    </a>
  )
}