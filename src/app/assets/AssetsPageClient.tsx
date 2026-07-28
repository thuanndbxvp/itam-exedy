'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreVertical, Edit2, Archive, Trash2, Upload, Download } from 'lucide-react'
import RoleGate from '@/components/RoleGate'
import CheckoutAssetButton from '@/components/assets/CheckoutAssetButton'
import CheckinAssetButton from '@/components/assets/CheckinAssetButton'
import BulkActionBar from '@/components/assets/BulkActionBar'
import CSVImportModal from '@/components/assets/CSVImportModal'
import Modal from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

const getStatusColor = (s: { deployable: boolean; pending: boolean; archived: boolean } | null) => {
  if (!s) return 'bg-gray-100 text-gray-700 border-gray-200'
  if (s.archived) return 'bg-slate-100 text-slate-700 border-slate-200'
  if (s.pending) return 'bg-amber-100 text-amber-700 border-amber-200'
  if (!s.deployable) return 'bg-rose-100 text-rose-700 border-rose-200'
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

const formatUserName = (u: { firstName: string; lastName: string | null } | null) => {
  if (!u) return ''
  return `${u.firstName ?? ''}${u.lastName ? ' ' + u.lastName : ''}`.trim()
}

interface Props {
  assets: {
    id: string
    assetTag: string
    name: string
    serial: string | null
    createdAt: string
    assignedUserId: string | null
    assignedLocationId: string | null
    assignedAssetId: string | null
    status: { name: string; deployable: boolean; pending: boolean; archived: boolean }
    assignedUser: { firstName: string; lastName: string | null } | null
    assignedLocation: { name: string } | null
    assignedAsset: { assetTag: string } | null
  }[]
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  locations: { id: string; name: string }[]
  transferableAssets: { id: string; assetTag: string; name: string }[]
  filterNode?: React.ReactNode
}

export default function AssetsPageClient({
  assets,
  users,
  locations,
  transferableAssets,
  filterNode,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const { showCommandResult } = useToast()
  const router = useRouter()

  async function handleSingleDelete() {
    if (!deleteAssetId) return
    if (!deletePassword.trim()) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/assets/${deleteAssetId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (data.ok) {
        setDeleteAssetId(null)
        setDeletePassword('')
        setSelectedIds((prev) => prev.filter((id) => id !== deleteAssetId))
        router.refresh()
      }
      showCommandResult(data)
    } catch (e) {
      showCommandResult({ ok: false, code: 'INTERNAL', message: String(e) })
    } finally {
      setIsDeleting(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function toggleAll() {
    if (selectedIds.length === assets.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(assets.map((a) => a.id))
    }
  }

  function handleExportCSV() {
    window.location.href = '/api/assets/export'
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm theo mã thẻ, tên, serial..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition"
              />
            </div>
            {filterNode && <div>{filterNode}</div>}
          </div>

          <div className="flex items-center gap-3">
            <RoleGate allowedRoles={['ADMIN']}>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl transition shadow-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl transition shadow-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <Link
                href="/assets/new"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition shadow-sm font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Thêm Tài Sản</span>
              </Link>
            </RoleGate>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-500">
                  <th className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === assets.length && assets.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Tài sản (Asset)</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Người/Vị trí/Thiết bị giữ</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Ngày tạo</th>
                  <th className="px-6 py-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Archive className="w-10 h-10 text-gray-300" />
                        <p>Kho lưu trữ đang trống. Hãy bắt đầu thêm tài sản đầu tiên!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const assignedLabel = asset.assignedUser
                      ? formatUserName(asset.assignedUser)
                      : asset.assignedLocation
                      ? asset.assignedLocation.name
                      : asset.assignedAsset
                      ? `[Asset] ${asset.assignedAsset.assetTag}`
                      : null

                    const assignedInitials = asset.assignedUser
                      ? (asset.assignedUser.firstName?.charAt(0).toUpperCase() ?? '?')
                      : asset.assignedLocation
                      ? (asset.assignedLocation.name?.charAt(0).toUpperCase() ?? 'L')
                      : asset.assignedAsset
                      ? 'A'
                      : '?'

                    const isAssigned = !!(asset.assignedUserId || asset.assignedLocationId || asset.assignedAssetId)

                    return (
                      <tr
                        key={asset.id}
                        className={`hover:bg-slate-50/50 transition ${selectedIds.includes(asset.id) ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(asset.id)}
                            onChange={() => toggleSelection(asset.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/assets/${asset.id}`} className="flex items-center space-x-3 hover:opacity-80 transition">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                              {asset.assetTag.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{asset.name}</p>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">
                                {asset.assetTag} • {asset.serial || 'N/A'}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${isAssigned ? 'bg-blue-100 text-blue-700 border-blue-200' : getStatusColor(asset.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                            {isAssigned ? 'Đang sử dụng' : (asset.status?.name || 'Không rõ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {assignedLabel ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                {assignedInitials}
                              </div>
                              <span>{assignedLabel}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">---</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(asset.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <RoleGate allowedRoles={['ADMIN']}>
                              {isAssigned ? (
                                <CheckinAssetButton
                                  assetId={asset.id}
                                  assetTag={asset.assetTag}
                                />
                              ) : (
                                <CheckoutAssetButton
                                  assetId={asset.id}
                                  assetTag={asset.assetTag}
                                  users={users}
                                  locations={locations}
                                  assets={transferableAssets}
                                />
                              )}
                              <Link href={`/assets/${asset.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition inline-flex items-center justify-center" title="Sửa">
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button onClick={() => setDeleteAssetId(asset.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </RoleGate>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {assets.length > 0 ? (
                <>
                  <span className="font-medium text-gray-900">{assets.length}</span> tài sản
                  {selectedIds.length > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">({selectedIds.length} đã chọn)</span>
                  )}
                </>
              ) : (
                'Không có tài sản nào'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar — ADMIN only */}
      <RoleGate allowedRoles={['ADMIN']}>
        <BulkActionBar
          selectedIds={selectedIds}
          users={users}
          onClearSelection={() => setSelectedIds([])}
        />
      </RoleGate>

      {/* CSV Import Modal */}
      {showImportModal && (
        <CSVImportModal onClose={() => setShowImportModal(false)} />
      )}

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteAssetId}
        onClose={() => {
          if (!isDeleting) { setDeleteAssetId(null); setDeletePassword('') }
        }}
        title="Xác nhận xóa tài sản"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa tài sản này? Mọi thông tin liên quan sẽ bị chuyển vào thùng rác.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu xác nhận <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSingleDelete()}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="Nhập mật khẩu đăng nhập của bạn"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setDeleteAssetId(null); setDeletePassword('') }}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSingleDelete}
              disabled={isDeleting || !deletePassword.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
