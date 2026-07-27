'use client'

import EntityTable, { type FieldDef } from '@/components/settings/EntityTable'
import { Package, Phone, Mail, MapPin } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  contact: string | null
  address: string | null
  phone: string | null
  email: string | null
  url: string | null
  notes: string | null
}

interface Props {
  suppliers: Supplier[]
}

const FIELDS: FieldDef[] = [
  { kind: 'text', name: 'name', label: 'Tên', required: true, placeholder: 'VD: Viettel, FPT, VNG...' },
  { kind: 'text', name: 'contact', label: 'Người liên hệ', placeholder: 'Tên người liên hệ' },
  { kind: 'tel', name: 'phone', label: 'Điện thoại' },
  { kind: 'email', name: 'email', label: 'Email' },
  { kind: 'text', name: 'address', label: 'Địa chỉ' },
  { kind: 'url', name: 'url', label: 'Website', placeholder: 'https://...' },
  { kind: 'textarea', name: 'notes', label: 'Ghi chú', rows: 3 },
]

export default function SuppliersTable({ suppliers }: Props) {
  return (
    <EntityTable<Supplier>
      rows={suppliers}
      endpoint="/api/settings/suppliers"
      listTitle={`Danh sách nhà cung cấp (${suppliers.length})`}
      deleteTitle="Xóa nhà cung cấp"
      deleteMessage="Bạn có chắc muốn xóa nhà cung cấp này?"
      emptyMessage={
        <div>
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có nhà cung cấp nào.</p>
        </div>
      }
      form={{
        fields: FIELDS,
        title: 'Thêm nhà cung cấp',
        editTitle: () => 'Sửa nhà cung cấp',
        emptyFormValues: () => ({
          name: '',
          contact: '',
          phone: '',
          email: '',
          address: '',
          url: '',
          notes: '',
        }),
        toFormValues: (s) => ({
          name: s.name,
          contact: s.contact ?? '',
          phone: s.phone ?? '',
          email: s.email ?? '',
          address: s.address ?? '',
          url: s.url ?? '',
          notes: s.notes ?? '',
        }),
      }}
      columns={[
        {
          key: 'name',
          label: 'Tên',
          tdClassName: 'font-medium text-gray-900',
          render: (s) => s.name,
        },
        {
          key: 'contact',
          label: 'Liên hệ',
          render: (s) => (
            <div className="space-y-1">
              {s.contact && <div>{s.contact}</div>}
              {s.phone && (
                <div className="flex items-center gap-1">
                  <Phone size={12} /> {s.phone}
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-1">
                  <Mail size={12} /> {s.email}
                </div>
              )}
              {!s.contact && !s.phone && !s.email && '—'}
            </div>
          ),
        },
        {
          key: 'address',
          label: 'Địa chỉ',
          render: (s) =>
            s.address ? (
              <div className="flex items-start gap-1">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                {s.address}
              </div>
            ) : (
              '—'
            ),
        },
      ]}
    />
  )
}