'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import CheckoutAssetModal from './CheckoutAssetModal'

interface CheckoutAssetButtonProps {
  assetId: string
  assetTag: string
  /** Server Component parent load sẵn để truyền xuống — tránh fetch từ client. */
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  locations: { id: string; name: string }[]
  /** Sprint B7: list asset khả thi để chọn khi gán cho thiết bị khác. */
  assets: { id: string; assetTag: string; name: string }[]
}

/**
 * Nút "Cấp phát" — mở CheckoutAssetModal.
 *
 * Phase 1: chỉ hiển thị cho ADMIN (wrap trong <RoleGate> ở assets/page.tsx).
 * Server action `checkoutAssetCmd` enforce `requirePermission('assets.checkout')` — UI chỉ là cosmetic.
 */
export default function CheckoutAssetButton({
  assetId,
  assetTag,
  users,
  locations,
  assets,
}: CheckoutAssetButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-200"
      >
        <ShoppingCart size={14} className="mr-1" />
        Cấp phát
      </button>
      <CheckoutAssetModal
        open={open}
        onClose={() => setOpen(false)}
        assetId={assetId}
        assetTag={assetTag}
        users={users}
        locations={locations}
        assets={assets}
      />
    </>
  )
}