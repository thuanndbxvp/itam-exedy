import { ElementType, ReactNode } from 'react'

interface Props {
  isEmpty: boolean
  emptyIcon: ElementType
  emptyText: string
  emptyButtonText?: string
  onEmptyClick?: () => void
  table: ReactNode
  modal?: ReactNode
  confirmModal?: ReactNode
}

export default function SettingsTableLayout({
  isEmpty,
  emptyIcon: Icon,
  emptyText,
  emptyButtonText,
  onEmptyClick,
  table,
  modal,
  confirmModal,
}: Props) {
  return (
    <>
      {isEmpty ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Icon size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{emptyText}</p>
          {emptyButtonText && onEmptyClick && (
            <button
              onClick={onEmptyClick}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
            >
              {emptyButtonText}
            </button>
          )}
        </div>
      ) : (
        table
      )}
      {modal}
      {confirmModal}
    </>
  )
}
