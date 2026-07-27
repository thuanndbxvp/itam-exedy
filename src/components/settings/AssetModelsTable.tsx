'use client'

import EntityTable, { type FieldDef } from '@/components/settings/EntityTable'
import { Box } from 'lucide-react'

interface AssetModel {
  id: string
  name: string
  modelNumber: string | null
  categoryId: string
  manufacturerId: string | null
  depreciationId: string | null
  eol: number | null
  requireSerial: boolean
  notes: string | null
  category?: { name: string } | null
  manufacturer?: { name: string } | null
}

interface Props {
  models: AssetModel[]
  categories: { id: string; name: string }[]
  manufacturers: { id: string; name: string }[]
  depreciations: { id: string; name: string }[]
}

export default function AssetModelsTable({
  models,
  categories,
  manufacturers,
  depreciations,
}: Props) {
  const fields: FieldDef[] = [
    {
      kind: 'text',
      name: 'name',
      label: 'Tên model',
      required: true,
      placeholder: 'VD: ThinkPad X1 Carbon Gen 11',
    },
    { kind: 'text', name: 'modelNumber', label: 'Mã model' },
    {
      kind: 'number',
      name: 'eol',
      label: 'EOL (tháng)',
      parse: (v) => (v ? Number(v) : null),
    },
    {
      kind: 'select',
      name: 'categoryId',
      label: 'Danh mục',
      required: true,
      placeholder: '— Chọn danh mục —',
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      kind: 'select',
      name: 'manufacturerId',
      label: 'Nhà sản xuất',
      placeholder: '— Không —',
      options: manufacturers.map((m) => ({ value: m.id, label: m.name })),
    },
    {
      kind: 'select',
      name: 'depreciationId',
      label: 'Phương thức khấu hao',
      placeholder: '— Không —',
      options: depreciations.map((d) => ({ value: d.id, label: d.name })),
    },
    { kind: 'checkbox', name: 'requireSerial', label: 'Yêu cầu nhập serial' },
    { kind: 'textarea', name: 'notes', label: 'Ghi chú', rows: 2 },
  ]

  return (
    <EntityTable<AssetModel>
      rows={models}
      endpoint="/api/settings/asset-models"
      listTitle={`Danh sách model (${models.length})`}
      deleteTitle="Xóa model"
      deleteMessage="Bạn có chắc muốn xóa model này?"
      emptyMessage={
        <div>
          <Box size={48} className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có model nào.</p>
        </div>
      }
      form={{
        fields,
        title: 'Thêm model',
        editTitle: () => 'Sửa model',
        emptyFormValues: () => ({
          name: '',
          modelNumber: '',
          categoryId: '',
          manufacturerId: '',
          depreciationId: '',
          eol: '',
          requireSerial: false,
          notes: '',
        }),
        toFormValues: (m) => ({
          name: m.name,
          modelNumber: m.modelNumber ?? '',
          categoryId: m.categoryId,
          manufacturerId: m.manufacturerId ?? '',
          depreciationId: m.depreciationId ?? '',
          eol: m.eol ? String(m.eol) : '',
          requireSerial: m.requireSerial,
          notes: m.notes ?? '',
        }),
      }}
      columns={[
        {
          key: 'name',
          label: 'Tên model',
          tdClassName: 'font-medium text-gray-900',
          render: (m) => m.name,
        },
        {
          key: 'modelNumber',
          label: 'Mã',
          tdClassName: 'text-sm text-gray-500 font-mono',
          render: (m) => m.modelNumber || '—',
        },
        {
          key: 'category',
          label: 'Danh mục',
          render: (m) => m.category?.name ?? '—',
        },
        {
          key: 'manufacturer',
          label: 'Hãng',
          render: (m) => m.manufacturer?.name ?? '—',
        },
        {
          key: 'eol',
          label: 'EOL (tháng)',
          render: (m) => (m.eol ?? '—'),
        },
      ]}
    />
  )
}