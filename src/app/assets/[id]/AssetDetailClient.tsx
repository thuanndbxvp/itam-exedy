'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Trash2, Monitor, User, MapPin, Calendar,
  Package, Tag, Building2, Shield, DollarSign, Clock,
  CheckCircle, XCircle, AlertCircle, History, Wrench, Key, Plus, Loader2, FileText
} from 'lucide-react'
import RoleGate from '@/components/RoleGate'
import CheckoutAssetButton from '@/components/assets/CheckoutAssetButton'
import CheckinAssetButton from '@/components/assets/CheckinAssetButton'
import MarkAuditedButton from '@/components/assets/MarkAuditedButton'
import AssetHistoryTimeline from '@/components/assets/AssetHistoryTimeline'
import AssetMaintenanceList from '@/components/assets/AssetMaintenanceList'
import AssignLicenseModal from '@/components/licenses/AssignLicenseModal'
import AssetAcceptanceBanner from '@/components/assets/AssetAcceptanceBanner'
import HealthScoreBadge, { HealthScoreCard, ReplacementAlertBanner } from '@/components/assets/HealthScoreBadge'
import HandoverHistory from '@/components/assets/HandoverHistory'
import { useToast } from '@/components/Toast'
import Modal from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

interface LicenseSeatLite {
  id: string
  licenseId: string
  notes: string | null
  seatLabel: string
  license: {
    id: string
    name: string
    productKey: string | null
    expirationDate: string | null
  }
  createdAt: string
}

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
  assignedLocationId: string | null
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
  licenseSeats: LicenseSeatLite[]
  // C.8: Child assets
  assignedToAssets?: {
    id: string
    assetTag: string
    name: string
    categoryName: string | null
    statusName: string | null
    statusColor: string | null
  }[]
  // C.11: Health Score
  repairCount?: number
  totalRepairCost?: number | null
  healthScore?: number | null
  lastHealthCheck?: string | null
}

interface Props {
  asset: Asset
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  locations: { id: string; name: string }[]
  statuses: { id: string; name: string; deployable: boolean; pending: boolean; archived: boolean }[]
  transferableAssets?: { id: string; assetTag: string; name: string }[]
  /** Sprint C4: banner accept/decline nếu user hiện tại = assignedUserId */
  acceptanceStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'NOT_ASSIGNED'
  currentUserId?: string | null
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const formatCurrency = (amount: number | null) => {
  if (amount === null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const getStatusBadge = (status: Asset['status'], isAssigned: boolean = false) => {
  if (isAssigned) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Đang sử dụng</span>
  if (status.archived) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Archived</span>
  if (status.pending) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
  if (!status.deployable) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Unavailable</span>
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Ready to Deploy</span>
}

export default function AssetDetailClient({
  asset,
  users,
  locations,
  statuses,
  transferableAssets = [],
  acceptanceStatus = 'NOT_ASSIGNED',
  currentUserId,
}: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'maintenance' | 'licenses' | 'children' | 'handover'>('overview')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [checkinSeatId, setCheckinSeatId] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [confirmCheckinSeat, setConfirmCheckinSeat] = useState<LicenseSeatLite | null>(null)

  // Determine edit permissions based on user role:
  // - ADMIN: full edit
  // - IT roles: assets.update via /api/* endpoints
  // - EMPLOYEE: read-only
  const canEdit = users.length > 0 // ADMIN has full users list (page-level signal)

  const handleDelete = async () => {
    if (!deletePassword.trim()) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (data.ok) {
        router.push('/assets')
        router.refresh()
      } else {
        showCommandResult(data)
      }
    } catch (e) {
      showCommandResult({ ok: false, code: 'INTERNAL', message: String(e) })
    } finally {
      setDeleting(false)
    }
  }

  async function handleCheckinSeat(seatId: string) {
    setCheckinSeatId(seatId)
    try {
      const res = await fetch('/api/licenses/checkin-seat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ seatId }),
      })
      const json = await res.json()
      showCommandResult(json)
      if (json.ok) {
        router.refresh()
      }
    } catch (e) {
      showCommandResult({ ok: false, code: 'INTERNAL', message: String(e) })
    } finally {
      setCheckinSeatId(null)
      setConfirmCheckinSeat(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Sprint C4: Asset acceptance banner */}
      {acceptanceStatus !== 'NOT_ASSIGNED' && currentUserId === asset.assignedUserId && (
        <AssetAcceptanceBanner
          assetId={asset.id}
          assetTag={asset.assetTag}
          initialStatus={acceptanceStatus}
        />
      )}

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
              {getStatusBadge(asset.status, !!(asset.assignedUserId || asset.assignedLocationId || asset.assignedAssetId))}
            </div>
            <p className="text-sm text-gray-500 mt-1">{asset.assetTag}</p>
          </div>
        </div>

        <RoleGate allowedRoles={['ADMIN']}>
          <div className="flex items-center gap-2">
            <MarkAuditedButton assetId={asset.id} />
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

      {/* Tabs — Phase 2 Feature 1 & 2 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<Monitor size={16} />}
            label="Tổng quan"
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={<History size={16} />}
            label="Lịch sử cấp phát"
          />
          <TabButton
            active={activeTab === 'maintenance'}
            onClick={() => setActiveTab('maintenance')}
            icon={<Wrench size={16} />}
            label="Lịch sử sửa chữa"
          />
          <TabButton
            active={activeTab === 'licenses'}
            onClick={() => setActiveTab('licenses')}
            icon={<Key size={16} />}
            label={`Bản quyền (${asset.licenseSeats?.length ?? 0})`}
          />
          {/* C.8: Tab thiết bị đi kèm */}
          <TabButton
            active={activeTab === 'children'}
            onClick={() => setActiveTab('children')}
            icon={<Package size={16} />}
            label={`Thiết bị đi kèm (${asset.assignedToAssets?.length ?? 0})`}
          />
          {/* C.12: Tab biên bản bàn giao */}
          <TabButton
            active={activeTab === 'handover'}
            onClick={() => setActiveTab('handover')}
            icon={<FileText size={16} />}
            label="Biên bản BG"
          />
        </div>

        {activeTab === 'overview' && (
          <div className="p-6">
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
                <CheckoutAssetButton
                  assetId={asset.id}
                  assetTag={asset.assetTag}
                  users={users}
                  locations={locations}
                  assets={transferableAssets}
                  disabled={!asset.status.deployable || asset.status.archived || asset.status.pending}
                  disabledReason="Thiết bị không ở trạng thái sẵn sàng để cấp phát"
                />
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

          {/* C.11: Health Score */}
          {(asset.healthScore !== undefined || asset.repairCount !== undefined) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Điểm sức khỏe</h2>
              <HealthScoreBadge
                score={asset.healthScore ?? null}
                showBar={true}
                size="md"
                showLabel={true}
              />
              {asset.repairCount !== undefined && (
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Wrench size={12} />
                    {asset.repairCount} lần sửa chữa
                  </span>
                  {asset.totalRepairCost !== undefined && asset.totalRepairCost !== null && (
                    <span className="flex items-center gap-1">
                      <DollarSign size={12} />
                      {formatCurrency(asset.totalRepairCost)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

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
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            <AssetHistoryTimeline assetId={asset.id} />
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="p-6">
            <AssetMaintenanceList assetId={asset.id} canEdit={canEdit} />
          </div>
        )}

        {activeTab === 'licenses' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Bản quyền đã cài/cấp phát trên thiết bị này</h2>
              {canEdit && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus size={16} />
                  Gán bản quyền
                </button>
              )}
            </div>

            {!asset.licenseSeats || asset.licenseSeats.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <Key size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Chưa có bản quyền nào được gán trực tiếp cho thiết bị này.</p>
                {canEdit && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="mt-3 text-blue-600 hover:underline text-sm"
                  >
                    Gán ngay →
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Phần mềm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Product Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Seat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Hết hạn
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {asset.licenseSeats.map((seat) => {
                      const isExpired =
                        seat.license.expirationDate && new Date(seat.license.expirationDate) < new Date()
                      return (
                        <tr key={seat.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3">
                            <Link
                              href={`/licenses/${seat.license.id}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {seat.license.name}
                            </Link>
                          </td>
                          <td className="px-6 py-3">
                            <span className="font-mono text-xs text-gray-700">
                              {seat.license.productKey
                                ? `••••${seat.license.productKey.slice(-4)}`
                                : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-600">#{seat.seatLabel}</td>
                          <td className="px-6 py-3 text-xs">
                            {seat.license.expirationDate ? (
                              <span className={isExpired ? 'text-red-600' : 'text-gray-700'}>
                                {new Date(seat.license.expirationDate).toLocaleDateString('vi-VN')}
                                {isExpired && ' (hết hạn)'}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {canEdit && (
                              <button
                                onClick={() => setConfirmCheckinSeat(seat)}
                                disabled={checkingIn && checkinSeatId === seat.id}
                                className="inline-flex items-center gap-1 text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                              >
                                {checkingIn && checkinSeatId === seat.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                                Thu hồi
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* C.8: Tab thiết bị đi kèm (Child Assets) */}
        {activeTab === 'children' && (
          <div className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Thiết bị đi kèm</h2>
            {!asset.assignedToAssets || asset.assignedToAssets.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Không có thiết bị đi kèm nào.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Mã tài sản
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Tên thiết bị
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {asset.assignedToAssets.map((child) => (
                      <tr key={child.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <Link
                            href={`/assets/${child.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {child.assetTag}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-gray-900">{child.name}</td>
                        <td className="px-6 py-3 text-gray-600">{child.categoryName ?? '—'}</td>
                        <td className="px-6 py-3">
                          {child.statusName && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: child.statusColor ? `${child.statusColor}20` : '#f3f4f6',
                                color: child.statusColor ?? '#6b7280',
                              }}
                            >
                              {child.statusName}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* C.12: Tab biên bản bàn giao */}
        {activeTab === 'handover' && (
          <div className="p-6">
            <HandoverHistory assetId={asset.id} />
          </div>
        )}
      </div>

      {/* Assign License Modal */}
      <AssignLicenseModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        assetId={asset.id}
        assetTag={asset.assetTag}
      />

      {/* Confirm Checkin Modal */}
      <Modal
        open={!!confirmCheckinSeat}
        onClose={() => {
          if (!checkingIn) setConfirmCheckinSeat(null)
        }}
        title="Thu hồi bản quyền"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Thu hồi seat{' '}
            <strong className="font-mono">#{confirmCheckinSeat?.seatLabel}</strong> của license{' '}
            <strong>{confirmCheckinSeat?.license.name}</strong> khỏi thiết bị này?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            Sau khi thu hồi, seat sẽ trở về trạng thái trống và có thể được cấp phát lại.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmCheckinSeat(null)}
              disabled={checkingIn}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={() => confirmCheckinSeat && handleCheckinSeat(confirmCheckinSeat.id)}
              disabled={checkingIn}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
            >
              {checkingIn && <Loader2 size={14} className="animate-spin" />}
              Thu hồi
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { if (!deleting) { setShowDeleteModal(false); setDeletePassword('') } }}
        title="Xác nhận xóa tài sản"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc muốn xóa tài sản <strong>{asset.name}</strong> ({asset.assetTag})?
          </p>
          <p className="text-sm text-red-600">Hành động này không thể hoàn tác.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu xác nhận <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="Nhập mật khẩu đăng nhập của bạn"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setShowDeleteModal(false); setDeletePassword('') }}
              disabled={deleting}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || !deletePassword.trim()}
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

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
