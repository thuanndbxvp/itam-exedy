'use client'

import EntityTable from '@/components/settings/EntityTable'
import { Tag } from 'lucide-react'
import type { StatusLabel } from '@prisma/client'

const COLOR_MAP: Record<string, string> = {
  deployable: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  undeployable: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-500',
}

interface Props {
  statuses: StatusLabel[]
}

function badgeKey(s: StatusLabel): string {
  return s.deployable
    ? 'deployable'
    : s.pending
    ? 'pending'
    : s.archived
    ? 'archived'
    : 'undeployable'
}

function typeLabel(s: StatusLabel): string {
  return s.deployable
    ? 'Sẵn sàng'
    : s.pending
    ? 'Chờ duyệt'
    : s.archived
    ? 'Lưu trữ'
    : 'Không sẵn sàng'
}

export default function StatusLabelTable({ statuses }: Props) {
  return (
    <EntityTable
      rows={statuses}
      endpoint="/api/settings/statuses"
      deleteTitle="Xóa trạng thái"
      deleteMessage="Bạn có chắc muốn xóa trạng thái này? Hành động này không thể hoàn tác."
      emptyMessage={
        <div>
          <Tag size={48} className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có trạng thái nào.</p>
        </div>
      }
      editHrefBase="/settings/statuses"
      showAddButton={false}
      columns={[
        {
          key: 'name',
          label: 'Tên',
          render: (s) => (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLOR_MAP[badgeKey(s)]}`}
            >
              {s.name}
            </span>
          ),
        },
        { key: 'type', label: 'Loại', render: (s) => typeLabel(s) },
        {
          key: 'color',
          label: 'Màu',
          render: (s) =>
            s.color ? (
              <span
                className="inline-block w-6 h-6 rounded border border-gray-200"
                style={{ backgroundColor: s.color }}
              />
            ) : null,
        },
      ]}
    />
  )
}