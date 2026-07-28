'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import CheckoutAssetModal from './CheckoutAssetModal'
import EulaModal from './EulaModal'

interface CheckoutAssetButtonProps {
  assetId: string
  assetTag: string
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  locations: { id: string; name: string }[]
  assets: { id: string; assetTag: string; name: string }[]
  /**
   * Sprint C3: nếu category có EULA requireAcceptance → check EULA trước khi mở checkout modal.
   * Server-side pre-calc để tránh client fetch.
   */
  eulaGate?: {
    categoryId: string
    categoryName: string
    eulaText: string
    alreadyAccepted: boolean
  } | null
  disabled?: boolean
  disabledReason?: string
}

/**
 * Nút "Cấp phát" — mở CheckoutAssetModal.
 * C3: nếu asset thuộc category yêu cầu EULA + user chưa accept → show EulaModal trước.
 */
export default function CheckoutAssetButton({
  assetId,
  assetTag,
  users,
  locations,
  assets,
  eulaGate,
  disabled,
  disabledReason,
}: CheckoutAssetButtonProps) {
  const [open, setOpen] = useState(false)
  const [eulaOpen, setEulaOpen] = useState(false)

  function handleClick() {
    if (eulaGate && !eulaGate.alreadyAccepted) {
      setEulaOpen(true)
      return
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition border ${
          disabled 
            ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed' 
            : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
        }`}
      >
        <ShoppingCart size={14} className="mr-1" />
        Cấp phát
      </button>

      {/* C3: EULA gate trước khi checkout */}
      {eulaGate && (
        <EulaModal
          open={eulaOpen}
          categoryId={eulaGate.categoryId}
          categoryName={eulaGate.categoryName}
          eulaText={eulaGate.eulaText}
          onAccept={() => {
            setEulaOpen(false)
            setOpen(true)
          }}
          onDecline={() => {
            setEulaOpen(false)
          }}
        />
      )}

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
