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
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-200"
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
