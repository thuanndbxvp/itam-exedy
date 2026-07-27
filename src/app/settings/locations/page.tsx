import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import LocationsTable from '@/components/settings/LocationsTable'
import { MapPin } from 'lucide-react'

export default async function LocationsPage() {
  try {
    await requirePermission('settings.read')
  } catch {
    redirect('/')
  }

  const [locations, users] = await Promise.all([
    prisma.location.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { deletedAt: null, activated: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: 'asc' },
    }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <MapPin size={24} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vị trí</h1>
            <p className="text-gray-500 mt-1">Quản lý danh sách vị trí (văn phòng, kho, chi nhánh).</p>
          </div>
        </div>
      </div>

      <LocationsTable locations={locations} users={users} />
    </div>
  )
}