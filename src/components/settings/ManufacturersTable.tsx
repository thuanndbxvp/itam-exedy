'use client'

import EntityTable, { type FieldDef } from '@/components/settings/EntityTable'
import { Factory, Globe, Phone, Mail } from 'lucide-react'

interface Manufacturer {
  id: string
  name: string
  url: string | null
  supportUrl: string | null
  supportPhone: string | null
  supportEmail: string | null
  notes: string | null
}

interface Props {
  manufacturers: Manufacturer[]
}

const FIELDS: FieldDef[] = [
  { kind: 'text', name: 'name', label: 'Tên', required: true, placeholder: 'VD: Dell, HP, Lenovo...' },
  { kind: 'url', name: 'url', label: 'Website', placeholder: 'https://...' },
  { kind: 'url', name: 'supportUrl', label: 'URL Hỗ trợ', placeholder: 'https://...' },
  { kind: 'tel', name: 'supportPhone', label: 'Điện thoại hỗ trợ' },
  { kind: 'email', name: 'supportEmail', label: 'Email hỗ trợ', placeholder: 'support@...' },
  { kind: 'textarea', name: 'notes', label: 'Ghi chú', rows: 3 },
]

export default function ManufacturersTable({ manufacturers }: Props) {
  return (
    <EntityTable<Manufacturer>
      rows={manufacturers}
      endpoint="/api/settings/manufacturers"
      listTitle={`Danh sách nhà sản xuất (${manufacturers.length})`}
      deleteTitle="Xóa nhà sản xuất"
      deleteMessage="Bạn có chắc muốn xóa nhà sản xuất này?"
      emptyMessage={
        <div>
          <Factory size={48} className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có nhà sản xuất nào.</p>
        </div>
      }
      form={{
        fields: FIELDS,
        title: 'Thêm nhà sản xuất',
        editTitle: () => 'Sửa nhà sản xuất',
        emptyFormValues: () => ({
          name: '',
          url: '',
          supportUrl: '',
          supportPhone: '',
          supportEmail: '',
          notes: '',
        }),
        toFormValues: (m) => ({
          name: m.name,
          url: m.url ?? '',
          supportUrl: m.supportUrl ?? '',
          supportPhone: m.supportPhone ?? '',
          supportEmail: m.supportEmail ?? '',
          notes: m.notes ?? '',
        }),
      }}
      columns={[
        {
          key: 'name',
          label: 'Tên',
          tdClassName: 'font-medium text-gray-900',
          render: (m) => m.name,
        },
        {
          key: 'url',
          label: 'Website',
          render: (m) =>
            m.url ? (
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Globe size={14} /> Website
              </a>
            ) : (
              '—'
            ),
        },
        {
          key: 'support',
          label: 'Hỗ trợ',
          render: (m) => (
            <div className="space-y-1">
              {m.supportPhone && (
                <div className="flex items-center gap-1">
                  <Phone size={12} /> {m.supportPhone}
                </div>
              )}
              {m.supportEmail && (
                <div className="flex items-center gap-1">
                  <Mail size={12} /> {m.supportEmail}
                </div>
              )}
              {!m.supportPhone && !m.supportEmail && '—'}
            </div>
          ),
        },
      ]}
    />
  )
}