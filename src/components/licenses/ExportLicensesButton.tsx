'use client'

import { Download } from 'lucide-react'

interface Props {
  /** Bộ lọc hiện tại của trang (search, status) để truyền cho API */
  searchParams: URLSearchParams
  canExport: boolean
}

/**
 * ExportLicensesButton — Link download CSV từ /api/licenses/export.
 *
 * Truyền kèm searchParams hiện tại để CSV export đúng theo filter đang chọn.
 * Dùng thẻ <a download> nên không cần fetch.
 */
export default function ExportLicensesButton({ searchParams, canExport }: Props) {
  if (!canExport) return null

  const params = new URLSearchParams()
  const search = searchParams.get('search')?.trim()
  const status = searchParams.get('status')
  if (search) params.set('search', search)
  if (status && status !== 'all') params.set('status', status)

  const qs = params.toString()
  const href = qs ? `/api/licenses/export?${qs}` : '/api/licenses/export'

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