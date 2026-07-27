'use client'

import EntityTable from '@/components/settings/EntityTable'
import { FolderOpen } from 'lucide-react'
import type { Category } from '@prisma/client'

interface Props {
  categories: Category[]
}

export default function CategoriesTable({ categories }: Props) {
  return (
    <EntityTable
      rows={categories}
      endpoint="/api/settings/categories"
      deleteTitle="Xóa danh mục"
      deleteMessage="Xóa danh mục này?"
      emptyMessage={
        <div>
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có danh mục nào.</p>
        </div>
      }
      editHrefBase="/settings/categories"
      showAddButton={false}
      columns={[
        {
          key: 'name',
          label: 'Tên',
          tdClassName: 'font-medium text-gray-900',
          render: (c) => c.name,
        },
        {
          key: 'categoryType',
          label: 'Loại',
          render: (c) => c.categoryType,
        },
        {
          key: 'color',
          label: 'Màu',
          render: (c) =>
            c.color ? (
              <span
                className="inline-block w-6 h-6 rounded border border-gray-200"
                style={{ backgroundColor: c.color }}
              />
            ) : null,
        },
      ]}
    />
  )
}