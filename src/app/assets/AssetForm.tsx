import { createAsset, updateAsset } from '@/app/actions/asset'
import Link from 'next/link'
import { ArrowLeft, Save, MonitorSmartphone, Key, DollarSign, MapPin, Wrench } from 'lucide-react'
import AssetImagePicker from '@/components/assets/AssetImagePicker'

interface Props {
  asset?: {
    id: string
    assetTag: string
    name: string
    serial: string | null
    modelId: string | null
    categoryId: string | null
    manufacturerId: string | null
    supplierId: string | null
    statusId: string
    image: string | null
    purchaseDate: string | null
    purchaseCost: number | null
    orderNumber: string | null
    warrantyMonths: number | null
    rtdLocationId: string | null
    depreciationId: string | null
    requestable: boolean
    byod: boolean
    notes: string | null
  }
  statuses: { id: string; name: string; deployable: boolean; pending: boolean; archived: boolean }[]
  categories: { id: string; name: string }[]
  models: { id: string; name: string }[]
  manufacturers: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  locations: { id: string; name: string }[]
  depreciations: { id: string; name: string }[]
}

export default function AssetForm({ asset, statuses, categories, models, manufacturers, suppliers, locations, depreciations }: Props) {
  const isEdit = !!asset

  async function handleSubmit(formData: FormData) {
    'use server'
    const purchaseCostRaw = formData.get('purchaseCost') as string
    const warrantyMonthsRaw = formData.get('warrantyMonths') as string

    const payload = {
      assetTag: formData.get('assetTag') as string,
      name: formData.get('name') as string,
      serial: (formData.get('serial') as string | null) ?? undefined,
      modelId: (formData.get('modelId') as string | null) ?? undefined,
      categoryId: (formData.get('categoryId') as string | null) ?? undefined,
      manufacturerId: (formData.get('manufacturerId') as string | null) ?? undefined,
      supplierId: (formData.get('supplierId') as string | null) ?? undefined,
      statusId: formData.get('statusId') as string,
      image: ((formData.get('image') as string | null)?.trim() || undefined),
      purchaseDate: (formData.get('purchaseDate') as string | null) || undefined,
      purchaseCost: purchaseCostRaw ? Number(purchaseCostRaw) : undefined,
      orderNumber: (formData.get('orderNumber') as string | null) ?? undefined,
      warrantyMonths: warrantyMonthsRaw ? Number(warrantyMonthsRaw) : undefined,
      rtdLocationId: (formData.get('rtdLocationId') as string | null) ?? undefined,
      depreciationId: (formData.get('depreciationId') as string | null) ?? undefined,
      requestable: formData.get('requestable') === 'on',
      byod: formData.get('byod') === 'on',
      notes: (formData.get('notes') as string | null) ?? undefined,
    }

    if (isEdit && asset) {
      await updateAsset({ id: asset.id, ...payload })
    } else {
      await createAsset(payload)
    }
  }

  const formatDate = (d: string | null) => d ? d.split('T')[0] : ''

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/assets" className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:shadow-sm transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEdit ? 'Chỉnh sửa Tài sản' : 'Thêm mới Tài sản'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEdit ? `Đang chỉnh sửa: ${asset?.assetTag}` : 'Nhập thông tin chi tiết để thêm tài sản mới.'}
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MonitorSmartphone className="w-5 h-5 mr-2 text-blue-500" />
                Thông tin cơ bản
              </h3>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã tài sản <span className="text-red-500">*</span></label>
                    <input type="text" name="assetTag" required defaultValue={asset?.assetTag ?? ''}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                      placeholder="VD: LAP-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Serial Number</label>
                    <input type="text" name="serial" defaultValue={asset?.serial ?? ''}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên tài sản <span className="text-red-500">*</span></label>
                  <input type="text" name="name" required defaultValue={asset?.name ?? ''}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                    placeholder="VD: MacBook Pro M2 2023" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                    <select name="modelId" defaultValue={asset?.modelId ?? ''}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition">
                      <option value="">— Không —</option>
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhà sản xuất</label>
                    <select name="manufacturerId" defaultValue={asset?.manufacturerId ?? ''}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition">
                      <option value="">— Không —</option>
                      {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* B6: Asset Image Picker */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hình ảnh</h3>
              <AssetImagePicker
                entityId={asset?.id ?? 'new'}
                initialImage={asset?.image ?? null}
              />
            </div>

            {/* Purchase Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-emerald-500" />
                Thông tin mua hàng
              </h3>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày mua</label>
                    <input type="date" name="purchaseDate" defaultValue={formatDate(asset?.purchaseDate ?? null)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá mua (VND)</label>
                    <input type="number" min="0" step="1000" name="purchaseCost" defaultValue={asset?.purchaseCost ?? ''}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhà cung cấp</label>
                    <select name="supplierId" defaultValue={asset?.supplierId ?? ''}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition">
                      <option value="">— Không —</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Số đơn hàng</label>
                    <input type="text" name="orderNumber" defaultValue={asset?.orderNumber ?? ''}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bảo hành (tháng)</label>
                  <input type="number" min="0" name="warrantyMonths" defaultValue={asset?.warrantyMonths ?? ''}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ghi chú</h3>
              <textarea name="notes" rows={4} defaultValue={asset?.notes ?? ''}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-none"
                placeholder="Thông tin bổ sung..." />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2 text-indigo-500" />
                Phân loại
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục <span className="text-red-500">*</span></label>
                  <select name="categoryId" defaultValue={asset?.categoryId ?? ''}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition">
                    <option value="">— Chọn —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái <span className="text-red-500">*</span></label>
                  <select name="statusId" required defaultValue={asset?.statusId ?? ''}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition">
                    <option value="">— Chọn —</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.archived ? '⚫ ' : s.pending ? '🟡 ' : s.deployable ? '🟢 ' : '🔴 '}{s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-purple-500" />
                Vị trí & Khấu hao
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vị trí mặc định (RTD)</label>
                  <select name="rtdLocationId" defaultValue={asset?.rtdLocationId ?? ''}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition">
                    <option value="">— Không —</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phương thức khấu hao</label>
                  <select name="depreciationId" defaultValue={asset?.depreciationId ?? ''}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition">
                    <option value="">— Không —</option>
                    {depreciations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-amber-500" />
                Tùy chọn
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="requestable" defaultChecked={asset?.requestable ?? true}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <span className="text-sm text-gray-700">Có thể yêu cầu cấp phát</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="byod" defaultChecked={asset?.byod ?? false}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <span className="text-sm text-gray-700">Thiết bị cá nhân (BYOD)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
          <Link href="/assets" className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm">
            Hủy
          </Link>
          <button type="submit" className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm">
            <Save className="w-5 h-5 mr-2" />
            {isEdit ? 'Cập nhật' : 'Lưu Tài Sản'}
          </button>
        </div>
      </form>
    </div>
  )
}