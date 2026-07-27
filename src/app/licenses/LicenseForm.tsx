import { createLicense, updateLicense } from '@/app/actions/license'
import Link from 'next/link'
import { ArrowLeft, Save, Key, Hash, Users, DollarSign, Package, Mail, AlertTriangle, Building2 } from 'lucide-react'

interface Props {
  license?: {
    id: string
    name: string
    productKey: string | null
    serial: string | null
    categoryId: string | null
    manufacturerId: string | null
    supplierId: string | null
    companyId: string | null
    expirationDate: string | null
    terminationDate: string | null
    reassignable: boolean
    maintained: boolean
    purchaseDate: string | null
    purchaseCost: number | null
    purchaseOrder: string | null
    orderNumber: string | null
    notes: string | null
    licenseEmail: string | null
    licenseName: string | null
    minAmt: number | null
  }
  categories: { id: string; name: string }[]
  manufacturers: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  companies: { id: string; name: string }[]
}

export default function LicenseForm({ license, categories, manufacturers, suppliers, companies }: Props) {
  const isEdit = !!license

  async function handleSubmit(formData: FormData) {
    'use server'
    const payload = {
      name: formData.get('name') as string,
      productKey: (formData.get('productKey') as string | null) ?? undefined,
      serial: (formData.get('serial') as string | null) ?? undefined,
      categoryId: (formData.get('categoryId') as string | null) ?? undefined,
      manufacturerId: (formData.get('manufacturerId') as string | null) ?? undefined,
      supplierId: (formData.get('supplierId') as string | null) ?? undefined,
      companyId: (formData.get('companyId') as string | null) ?? undefined,
      expirationDate: (formData.get('expirationDate') as string | null) || undefined,
      terminationDate: (formData.get('terminationDate') as string | null) || undefined,
      reassignable: formData.get('reassignable') === 'on',
      maintained: formData.get('maintained') === 'on',
      purchaseDate: (formData.get('purchaseDate') as string | null) || undefined,
      purchaseCost: formData.get('purchaseCost') ? Number(formData.get('purchaseCost') as string) : undefined,
      purchaseOrder: (formData.get('purchaseOrder') as string | null) ?? undefined,
      orderNumber: (formData.get('orderNumber') as string | null) ?? undefined,
      notes: (formData.get('notes') as string | null) ?? undefined,
      licenseEmail: (formData.get('licenseEmail') as string | null) ?? undefined,
      licenseName: (formData.get('licenseName') as string | null) ?? undefined,
      minAmt: formData.get('minAmt') ? Number(formData.get('minAmt') as string) : undefined,
    }

    if (isEdit && license) {
      await updateLicense({ id: license.id, ...payload })
    } else {
      const seatsTotal = parseInt((formData.get('seatsTotal') as string) || '1')
      await createLicense({ ...payload, seatsTotal })
    }
  }

  const formatDate = (d: string | null) => d ? d.split('T')[0] : ''

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/licenses" className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:shadow-sm transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEdit ? 'Chỉnh sửa Bản quyền' : 'Thêm mới Bản quyền'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEdit ? `Đang chỉnh sửa: ${license.name}` : 'Lưu trữ License Key và cấp phát cho nhân viên.'}
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Hash className="w-5 h-5 mr-2 text-indigo-500" />
            Thông tin cơ bản
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên phần mềm <span className="text-red-500">*</span></label>
              <input type="text" name="name" required defaultValue={license?.name ?? ''}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                placeholder="VD: Microsoft Office 365" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Key</label>
                <input type="text" name="productKey" defaultValue={license?.productKey ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition font-mono text-sm"
                  placeholder="XXXXX-XXXXX-XXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Serial Number</label>
                <input type="text" name="serial" defaultValue={license?.serial ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition font-mono text-sm" />
              </div>
            </div>
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tổng số seats <span className="text-red-500">*</span></label>
                <input type="number" name="seatsTotal" required min="1" defaultValue="1"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhà cung cấp</label>
                <select name="supplierId" defaultValue={license?.supplierId ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                  <option value="">— Không —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  <Building2 size={14} className="text-gray-500" />
                  Công ty (B8)
                </label>
                <select name="companyId" defaultValue={license?.companyId ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                  <option value="">— Không —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            Ngày tháng & Trạng thái
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày hết hạn</label>
                <input type="date" name="expirationDate" defaultValue={formatDate(license?.expirationDate ?? null)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày chấm dứt</label>
                <input type="date" name="terminationDate" defaultValue={formatDate(license?.terminationDate ?? null)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="reassignable" defaultChecked={license?.reassignable ?? true}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <span className="text-sm text-gray-700">Cho phép reassign seats</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="maintained" defaultChecked={license?.maintained ?? true}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <span className="text-sm text-gray-700">Đang được duy trì (maintained)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Purchase */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-emerald-500" />
            Thông tin mua hàng
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày mua</label>
                <input type="date" name="purchaseDate" defaultValue={formatDate(license?.purchaseDate ?? null)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá mua (VND)</label>
                <input type="number" min="0" name="purchaseCost" defaultValue={license?.purchaseCost ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số đơn hàng (PO)</label>
                <input type="text" name="purchaseOrder" defaultValue={license?.purchaseOrder ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số order</label>
                <input type="text" name="orderNumber" defaultValue={license?.orderNumber ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số seats tối thiểu</label>
              <input type="number" min="0" name="minAmt" defaultValue={license?.minAmt ?? ''}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
            </div>
          </div>
        </div>

        {/* Email & Notes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-500" />
            Email & Ghi chú
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email đăng ký</label>
                <input type="email" name="licenseEmail" defaultValue={license?.licenseEmail ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                  placeholder="license@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên người đăng ký</label>
                <input type="text" name="licenseName" defaultValue={license?.licenseName ?? ''}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
              <textarea name="notes" rows={3} defaultValue={license?.notes ?? ''}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition resize-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
          <Link href="/licenses" className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm">
            Hủy
          </Link>
          <button type="submit" className="flex items-center px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm">
            <Save className="w-5 h-5 mr-2" />
            {isEdit ? 'Cập nhật' : 'Lưu Bản Quyền'}
          </button>
        </div>
      </form>
    </div>
  )
}