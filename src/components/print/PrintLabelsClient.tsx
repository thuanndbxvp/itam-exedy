'use client'

/**
 * PrintLabelsClient — Sprint C1.
 *
 * Client-side: multi-select + search + render QR labels.
 * QR generation chạy async (qrcode lib) sau khi mount.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Printer, ArrowLeft, Search, RotateCcw, CheckSquare, Square } from 'lucide-react'
import { generateQrDataUri, assetDeepLink } from '@/lib/print/qr-generator'

interface AssetOption {
  id: string
  assetTag: string
  name: string
  serial: string | null
  statusName: string
  statusColor: string
  modelName: string
  categoryName: string
}

interface Props {
  assets: AssetOption[]
  baseUrl: string
}

export default function PrintLabelsClient({ assets, baseUrl }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [qrCache, setQrCache] = useState<Map<string, string>>(new Map())

  // Pre-generate QR cho đầu selected (cap 100 — performance safety)
  useEffect(() => {
    const cap = 100
    const toGen = Array.from(selected).slice(0, cap).filter((id) => !qrCache.has(id))
    if (toGen.length === 0) return
    Promise.all(
      toGen.map(async (id) => {
        const url = assetDeepLink(baseUrl, id)
        try {
          const dataUri = await generateQrDataUri(url, 160)
          return { id, dataUri }
        } catch {
          return { id, dataUri: '' }
        }
      })
    ).then((results) => {
      setQrCache((prev) => {
        const next = new Map(prev)
        for (const r of results) {
          if (r.dataUri) next.set(r.id, r.dataUri)
        }
        return next
      })
    })
  }, [selected, baseUrl, qrCache])

  const filtered = assets.filter((a) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      a.assetTag.toLowerCase().includes(s) ||
      a.name.toLowerCase().includes(s) ||
      (a.serial?.toLowerCase().includes(s) ?? false) ||
      a.modelName.toLowerCase().includes(s) ||
      a.categoryName.toLowerCase().includes(s)
    )
  })

  const selectedAssets = assets.filter((a) => selected.has(a.id))
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((a) => selected.has(a.id))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        // Unselect all visible
        const next = new Set(prev)
        for (const a of filtered) next.delete(a.id)
        return next
      }
      // Select all visible
      const next = new Set(prev)
      for (const a of filtered) next.add(a.id)
      return next
    })
  }

  function reset() {
    setSelected(new Set())
    setSearch('')
  }

  return (
    <>
      {/* Print-only CSS: ẩn UI khi in */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          @page {
            margin: 8mm;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="p-6 max-w-6xl mx-auto">
        <Link
          href="/assets"
          className="no-print inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={14} className="mr-1" /> Quay lại Assets
        </Link>

        <div className="no-print bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">In nhãn QR</h1>
              <p className="text-sm text-gray-500 mt-1">
                Chọn assets → bấm &quot;In&quot;. Mỗi nhãn có QR + assetTag.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Đã chọn: <strong>{selected.size}</strong>
              </span>
              <button
                type="button"
                onClick={reset}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1"
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={selected.size === 0}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Printer size={14} /> In ({selected.size})
              </button>
            </div>
          </div>

          {/* Search + select all */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm asset theo tag / name / serial / model / category..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={toggleAll}
              disabled={filtered.length === 0}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1 disabled:opacity-50"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare size={14} /> Bỏ chọn ({filtered.length})
                </>
              ) : (
                <>
                  <Square size={14} /> Chọn tất cả ({filtered.length})
                </>
              )}
            </button>
          </div>
        </div>

        {/* ASSET PICKER (no-print) */}
        <div className="no-print bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="max-h-[40vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase sticky top-0">
                <tr>
                  <th className="w-10 px-3 py-2"></th>
                  <th className="text-left px-3 py-2">AssetTag</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Model</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      Không tìm thấy asset nào.
                    </td>
                  </tr>
                )}
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => toggle(a.id)}
                    className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selected.has(a.id) ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded text-blue-600"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-blue-700">{a.assetTag}</td>
                    <td className="px-3 py-2 text-gray-900">{a.name}</td>
                    <td className="px-3 py-2 text-gray-600">{a.modelName || '—'}</td>
                    <td className="px-3 py-2">
                      <span
                        className="inline-flex px-2 py-0.5 rounded text-xs"
                        style={{
                          background: a.statusColor ? `${a.statusColor}20` : '#e5e7eb',
                          color: a.statusColor || '#374151',
                        }}
                      >
                        {a.statusName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRINT-ONLY LABEL GRID */}
        <div className="hidden print-only" style={{ display: 'none' }}>
          {selectedAssets.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8mm',
                padding: '4mm',
              }}
            >
              {selectedAssets.map((a) => {
                const qr = qrCache.get(a.id)
                return (
                  <div
                    key={a.id}
                    style={{
                      border: '1px solid #000',
                      borderRadius: '4mm',
                      padding: '3mm',
                      textAlign: 'center',
                      pageBreakInside: 'avoid',
                      background: 'white',
                    }}
                  >
                    {qr ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qr}
                        alt={a.assetTag}
                        style={{
                          width: '28mm',
                          height: '28mm',
                          margin: '0 auto',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28mm',
                          height: '28mm',
                          margin: '0 auto',
                          background: '#f3f4f6',
                        }}
                      />
                    )}
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        fontSize: '11pt',
                        marginTop: '2mm',
                      }}
                    >
                      {a.assetTag}
                    </div>
                    <div style={{ fontSize: '8pt', color: '#374151' }}>
                      {a.name}
                    </div>
                    {a.modelName && (
                      <div style={{ fontSize: '7pt', color: '#6b7280' }}>
                        {a.modelName}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
