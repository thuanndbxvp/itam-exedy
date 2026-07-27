'use client'

import EntityTable from '@/components/settings/EntityTable'
import { Building2 } from 'lucide-react'
import type { Company } from '@prisma/client'

interface Props {
  companies: Company[]
}

export default function CompaniesTable({ companies }: Props) {
  return (
    <EntityTable
      rows={companies}
      endpoint="/api/settings/companies"
      deleteTitle="Xóa công ty"
      deleteMessage="Bạn có chắc muốn xóa công ty này?"
      emptyMessage={
        <div>
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có công ty nào.</p>
        </div>
      }
      editHrefBase="/settings/companies"
      showAddButton={false}
      columns={[
        {
          key: 'name',
          label: 'Tên công ty',
          tdClassName: 'font-medium text-gray-900',
          render: (c) => c.name,
        },
        {
          key: 'notes',
          label: 'Ghi chú',
          render: (c) => c.notes || '—',
        },
      ]}
    />
  )
}