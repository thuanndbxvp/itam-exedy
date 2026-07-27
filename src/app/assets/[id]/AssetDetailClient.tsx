'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Trash2, Monitor, User, MapPin, Calendar,
  Package, Tag, Building2, Shield, DollarSign, Clock, History,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import RoleGate from '@/components/RoleGate'
import CheckoutAssetButton from '@/components/assets/CheckoutAssetButton'
import CheckinAssetButton from '@/components/assets/CheckinAssetButton'
import Modal from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

interface Asset {
  id: string
  assetTag: string
  name: string
  serial: string | null
  image: string | null
  status: { id: string; name: string; deployable: boolean; pending: boolean; archived: boolean }
  assignedUser: { id: string; firstName: string; lastName: string | null; email: string | null } | null
  assignedUserId: string | null
  assignedLocation: { id: string; name: string; address: string | null } | null
  assignedAsset: { id: string; assetTag: string; name: string } | null
  assignedAssetId: string | null
  rtdLocation: { id: string; name: string } | null
  category: { id: string; name: string } | null
  manufacturer: { id: string; name: string } | null
  model: { id: string; name: string; modelNumber: string | null } | null
  supplier: { id: string; name: string } | null
  depreciation: { id: string; name: string; months: number } | null
  purchaseDate: string | null
  purchaseCost: number | null
  orderNumber: string | null
  warrantyMonths: number | null
  assetEolDate: string | null
  requestable: boolean
  byod: boolean
  lastAuditDate: string | null
  nextAuditDate: string | null
  lastCheckout: string | null
  lastCheckin: string | null
  expectedCheckin: string | null
  checkoutCounter: number
  checkinCounter: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  asset: Asset
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  locations: { id: string; name: string }[]
  statuses: { id: string; name: string; deployable: boolean; pending: boolean; archived: boolean }[]
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const formatCurrency = (amount: number | null) => {
  if (amount === null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const getStatusBadge = (status: Asset['status']) => {
  if (status.archived) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Archived</span>
  if (status.pending) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
  if (!status.deployable) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Unavailable</span>
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Ready to Deploy</span>
}

export default function AssetDetailClient({ asset, users, locations, statuses }: Props) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/assets')
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    }
    setDeleting(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/assets"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
              {getStatusBadge(asset.status)}
            </div>
            <p className="text-sm text-gray-500 mt-1">{asset.assetTag}</p>
          </div>
        </div>

        <RoleGate allowedRoles={['ADMIN']}>
          <div className="flex items-center gap-2">
            <Link
              href={`/assets/${asset.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Edit2 size={16} />
              Sửa
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Xóa
            </button>
          </div>
        </RoleGate>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Image & Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-64 h-48 md:h-auto bg-gray-100 flex items-center justify-center">
                {asset.image ? (
                  <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Monitor size={48} />
                    <span className="text-sm mt-2">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Model</dt>
                    <dd className="text-sm text-gray-900 mt-1">{asset.model?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Serial</dt>
                    <dd className="text-sm text-gray-900 mt-1 font-mono">{asset.serial ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Hãng sản xuất</dt>
                    <dd className="text-sm text-gray-900 mt-1">{asset.manufacturer?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Danh mục</dt>
                    <dd className="text-sm text-gray-900 mt-1">{asset.category?.name ?? '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Thông tin assignment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Người được assign</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {asset.assignedUser
                      ? `${asset.assignedUser.firstName}${asset.assignedUser.lastName ? ' ' + asset.assignedUser.lastName : ''}`
                      : 'Chưa assign'}
                  </dd>
                  {asset.assignedUser?.email && (
                    <p className="text-xs text-gray-500 mt-0.5">{asset.assignedUser.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <MapPin size={20} className="text-purple-600" />
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Vị trí hiện tại</dt>
                  <dd className="text-sm text-gray-900 mt-1">{asset.assignedLocation?.name ?? '—'}</dd>
                  {asset.assignedLocation?.address && (
                    <p className="text-xs text-gray-500 mt-0.5">{asset.assignedLocation.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <MapPin size={20} className="text-amber-600" />
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Vị trí mặc định (RTD)</dt>
                  <dd className="text-sm text-gray-900 mt-1">{asset.rtdLocation?.name ?? '—'}</dd>
                </div>
              </div>

              {asset.assignedAsset && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Package size={20} className="text-green-600" />
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Consumable của</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      <Link href={`/assets/${asset.assignedAsset.id}`} className="text-blue-600 hover:underline">
                        {asset.assignedAsset.assetTag}
                      </Link>
                    </dd>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout/Checkin Actions */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-3">
              {asset.assignedUserId ? (
                <CheckinAssetButton assetId={asset.id} assetTag={asset.assetTag} />
              ) : (
                <CheckoutAssetButton assetId={asset.id} assetTag={asset.assetTag} users={users} locations={locations} />
              )}
            </div>
          </div>

          {/* Notes */}
          {asset.notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Ghi chú</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{asset.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Purchase Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Thông tin mua hàng</h2>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Giá trị</dt>
                  <dd className="text-sm text-gray-900 mt-1">{formatCurrency(asset.purchaseCost)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Ngày mua</dt>
                  <dd className="text-sm text-gray-900 mt-1">{formatDate(asset.purchaseDate)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</dt>
                  <dd className="text-sm text-gray-900 mt-1">{asset.supplier?.name ?? '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Số đơn hàng</dt>
                  <dd className="text-sm text-gray-900 mt-1">{asset.orderNumber ?? '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Bảo hành</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {asset.warrantyMonths ? `${asset.warrantyMonths} tháng` : '—'}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Depreciation & EOL */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Khấu hao & EOL</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Phương thức khấu hao</dt>
                <dd className="text-sm text-gray-900 mt-1">{asset.depreciation?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Ngày EOL</dt>
                <dd className="text-sm text-gray-900 mt-1">{formatDate(asset.assetEolDate)}</dd>
              </div>
            </dl>
          </div>

          {/* Audit History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Lịch sử kiểm tra</h2>
            <dl className="space-y-4">
              <div className="flex items-center gap-3">
                {asset.lastAuditDate ? (
                  <CheckCircle size={16} className="text-emerald-500" />
                ) : (
                  <XCircle size={16} className="text-gray-300" />
                )}
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Lần kiểm tra cuối</dt>
                  <dd className="text-sm text-gray-900 mt-1">{formatDate(asset.lastAuditDate)}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {asset.nextAuditDate ? (
                  <AlertCircle size={16} className="text-amber-500" />
                ) : (
                  <Clock size={16} className="text-gray-300" />
                )}
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Lần kiểm tra tiếp</dt>
                  <dd className="text-sm text-gray-900 mt-1">{formatDate(asset.nextAuditDate)}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Checkout Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Thống kê</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{asset.checkoutCounter}</p>
                <p className="text-xs text-gray-500 mt-1">Lần checkout</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{asset.checkinCounter}</p>
                <p className="text-xs text-gray-500 mt-1">Lần checkin</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Thông tin hệ thống</h2>
            <dl className="space-y-3 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Tạo lúc:</span>
                <span>{formatDate(asset.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cập nhật:</span>
                <span>{formatDate(asset.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Requestable:</span>
                <span>{asset.requestable ? 'Có' : 'Không'}</span>
              </div>
              <div className="flex justify-between">
                <span>BYOD:</span>
                <span>{asset.byod ? 'Có' : 'Không'}</span>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa tài sản"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc muốn xóa tài sản <strong>{asset.name}</strong> ({asset.assetTag})?
          </p>
          <p className="text-sm text-red-600">Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
