'use client'

import EntityTable, { type FieldDef } from '@/components/settings/EntityTable'
import { MapPin } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  zip: string | null
  parentId: string | null
  managerId: string | null
  notes: string | null
}

interface Props {
  locations: Location[]
  users: { id: string; firstName: string; lastName: string | null }[]
}

export default function LocationsTable({ locations, users }: Props) {
  const locationOptions = locations
    .filter((l) => true) // tất cả, kể cả chính nó — LocationsTable cũ cho phép parent = self trước kia
    .map((l) => ({ value: l.id, label: l.name }))

  const userOptions = users.map((u) => ({
    value: u.id,
    label: [u.firstName, u.lastName].filter(Boolean).join(' '),
  }))

  const fields: FieldDef[] = [
    {
      kind: 'text',
      name: 'name',
      label: 'Tên',
      required: true,
      placeholder: 'VD: Văn phòng Hà Nội, Kho tổng...',
    },
    { kind: 'text', name: 'address', label: 'Địa chỉ' },
    { kind: 'text', name: 'city', label: 'Thành phố' },
    { kind: 'text', name: 'state', label: 'Tỉnh/Bang' },
    { kind: 'text', name: 'zip', label: 'Mã bưu chính' },
    { kind: 'text', name: 'country', label: 'Quốc gia' },
    {
      kind: 'select',
      name: 'parentId',
      label: 'Trực thuộc',
      placeholder: '— Không —',
      options: locationOptions,
    },
    {
      kind: 'select',
      name: 'managerId',
      label: 'Quản lý',
      placeholder: '— Không —',
      options: userOptions,
    },
    { kind: 'textarea', name: 'notes', label: 'Ghi chú', rows: 2 },
  ]

  return (
    <EntityTable<Location>
      rows={locations}
      endpoint="/api/settings/locations"
      listTitle={`Danh sách vị trí (${locations.length})`}
      deleteTitle="Xóa vị trí"
      deleteMessage="Bạn có chắc muốn xóa vị trí này?"
      emptyMessage={
        <div>
          <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có vị trí nào.</p>
        </div>
      }
      form={{
        fields,
        title: 'Thêm vị trí',
        editTitle: () => 'Sửa vị trí',
        emptyFormValues: () => ({
          name: '',
          address: '',
          city: '',
          state: '',
          country: 'Việt Nam',
          zip: '',
          parentId: '',
          managerId: '',
          notes: '',
        }),
        toFormValues: (l) => ({
          name: l.name,
          address: l.address ?? '',
          city: l.city ?? '',
          state: l.state ?? '',
          country: l.country ?? 'Việt Nam',
          zip: l.zip ?? '',
          parentId: l.parentId ?? '',
          managerId: l.managerId ?? '',
          notes: l.notes ?? '',
        }),
      }}
      columns={[
        {
          key: 'name',
          label: 'Tên',
          tdClassName: 'font-medium text-gray-900',
          render: (l) => l.name,
        },
        {
          key: 'address',
          label: 'Địa chỉ',
          render: (l) => l.address || '—',
        },
        {
          key: 'city',
          label: 'Thành phố',
          render: (l) => l.city || '—',
        },
        {
          key: 'parent',
          label: 'Trực thuộc',
          render: (l) => locations.find((x) => x.id === l.parentId)?.name ?? '—',
        },
      ]}
    />
  )
}