/**
 * Status Labels CRUD — F-6: quản lý StatusLabel (thêm "Chờ duyệt", "Đang bảo hành").
 *
 * Phase 1 dùng hard-coded status. Phase 2 admin cần CRUD để customize.
 */
import prisma from '@/lib/prisma'
import StatusLabelTable from '@/components/settings/StatusLabelTable'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getStatuses() {
  try {
    return await prisma.statusLabel.findMany({
      orderBy: { name: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function StatusesPage() {
  try {
    await requirePermission('settings.read')
  } catch {
    redirect('/')
  }

  const statuses = await getStatuses()

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Trạng thái tài sản</h1>
          <p className="text-gray-500">Quản lý nhãn trạng thái cho tài sản và license.</p>
        </div>
        <Link
          href="/settings/statuses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          + Thêm trạng thái
        </Link>
      </div>

      <StatusLabelTable statuses={statuses} />
    </div>
  )
}
