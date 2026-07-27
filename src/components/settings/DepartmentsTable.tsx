'use client'

import EntityTable from '@/components/settings/EntityTable'
import { Network, Building2, User as UserIcon, MapPin } from 'lucide-react'

interface CompanyOpt { id: string; name: string }
interface ManagerOpt { id: string; firstName: string; lastName: string | null }
interface LocationOpt { id: string; name: string }

export interface DepartmentRow {
  id: string
  name: string
  notes: string | null
  managerId: string | null
  companyId: string | null
  locationId: string | null
  manager?: ManagerOpt | null
  company?: CompanyOpt | null
  location?: LocationOpt | null
  _count?: { users: number }
}

interface Props {
  departments: DepartmentRow[]
  companies: CompanyOpt[]
  managers: ManagerOpt[]
  locations: LocationOpt[]
}

export default function DepartmentsTable({ departments, companies, managers, locations }: Props) {
  return (
    <EntityTable
      rows={departments}
      endpoint="/api/settings/departments"
      deleteTitle="Xóa phòng ban"
      deleteMessage="Bạn có chắc muốn xóa phòng ban này?"
      emptyMessage={
        <div>
          <Network size={48} className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có phòng ban nào.</p>
        </div>
      }
      form={{
        title: 'Tạo phòng ban',
        editTitle: (row) => `Sửa phòng ban: ${row.name}`,
        emptyFormValues: () => ({
          name: '',
          companyId: '',
          locationId: '',
          managerId: '',
          notes: '',
        }),
        toFormValues: (row) => ({
          id: row.id,
          name: row.name,
          companyId: row.companyId ?? '',
          locationId: row.locationId ?? '',
          managerId: row.managerId ?? '',
          notes: row.notes ?? '',
        }),
        fields: [
          {
            kind: 'text',
            name: 'name',
            label: 'Tên phòng ban',
            required: true,
            placeholder: 'VD: Phòng Kỹ thuật',
          },
          {
            kind: 'select',
            name: 'companyId',
            label: 'Công ty',
            placeholder: '— Không gắn với công ty —',
            options: companies.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            kind: 'select',
            name: 'locationId',
            label: 'Vị trí / Địa điểm',
            placeholder: '— Không gắn với vị trí —',
            options: locations.map((l) => ({ value: l.id, label: l.name })),
          },
          {
            kind: 'select',
            name: 'managerId',
            label: 'Trưởng phòng',
            placeholder: '— Chưa có —',
            options: managers.map((m) => ({
              value: m.id,
              label: [m.firstName, m.lastName].filter(Boolean).join(' '),
            })),
          },
          {
            kind: 'textarea',
            name: 'notes',
            label: 'Ghi chú',
            rows: 3,
            placeholder: 'Mô tả ngắn gọn...',
          },
        ],
      }}
      columns={[
        {
          key: 'name',
          label: 'Phòng ban',
          render: (d) => (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Network size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{d.name}</p>
                {d.notes && <p className="text-xs text-gray-500 line-clamp-1">{d.notes}</p>}
              </div>
            </div>
          ),
        },
        {
          key: 'company',
          label: 'Công ty',
          render: (d) =>
            d.company ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                <Building2 size={14} className="text-gray-400" />
                {d.company.name}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            ),
        },
        {
          key: 'manager',
          label: 'Trưởng phòng',
          render: (d) =>
            d.manager ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                <UserIcon size={14} className="text-gray-400" />
                {[d.manager.firstName, d.manager.lastName].filter(Boolean).join(' ')}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            ),
        },
        {
          key: 'location',
          label: 'Vị trí',
          render: (d) =>
            d.location ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                {d.location.name}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            ),
        },
        {
          key: 'users',
          label: 'Số nhân viên',
          render: (d) => (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              {d._count?.users ?? 0} người
            </span>
          ),
        },
      ]}
    />
  )
}
