/**
 * Audit Report Page — Sprint C.12
 *
 * Server Component:
 * - Phân quyền `reports.view` (ADMIN / IT_MANAGER)
 * - Render header, wrap với Client Component để fetch data
 */
import { redirect } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'
import { requirePermission } from '@/lib/permissions/guard'
import AuditReportClient from './AuditReportClient'

export default async function AuditReportPage() {
  try {
    await requirePermission('reports.view')
  } catch {
    redirect('/')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50">
          <ClipboardCheck className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo Kiểm kê</h1>
          <p className="text-gray-500 text-sm">
            Theo dõi và quản lý lịch kiểm kê tài sản. Chú ý các tài sản quá hạn hoặc sắp đến hạn.
          </p>
        </div>
      </div>

      {/* Client Component */}
      <AuditReportClient />
    </div>
  )
}
