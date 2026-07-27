'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, User, Key, X, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  assetTag?: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  serial?: string
  type: 'ASSET' | 'USER' | 'LICENSE'
  href: string
}

interface SearchResponse {
  ok: boolean
  data: {
    ASSET: SearchResult[]
    USER: SearchResult[]
    LICENSE: SearchResult[]
    total: number
  }
}

export default function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    setSelectedIndex(0)
  }, [])

  // Keyboard shortcut: "/" to open (global listener)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement
        if (!['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
          e.preventDefault()
          openModal()
        }
      }
      if (e.key === 'Escape' && isOpen) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, openModal, closeModal])

  // Expose open function via custom event
  useEffect(() => {
    function handleOpenSearch(e: Event) {
      e.preventDefault()
      openModal()
    }
    window.addEventListener('open-global-search', handleOpenSearch)
    return () => window.removeEventListener('open-global-search', handleOpenSearch)
  }, [openModal])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
        const data: SearchResponse = await res.json()
        if (data.ok) {
          const all: SearchResult[] = [
            ...data.data.ASSET,
            ...data.data.USER,
            ...data.data.LICENSE,
          ]
          setResults(all)
          setSelectedIndex(0)
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].href)
      closeModal()
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'ASSET': return <Package size={16} className="text-blue-500" />
      case 'USER': return <User size={16} className="text-green-500" />
      case 'LICENSE': return <Key size={16} className="text-purple-500" />
      default: return null
    }
  }

  function getSubtitle(result: SearchResult) {
    if (result.type === 'ASSET') {
      const tag = result.assetTag ?? result.id
      return tag + (result.serial ? ` · ${result.serial}` : '')
    }
    if (result.type === 'USER') {
      const fullName = [result.firstName, result.lastName].filter(Boolean).join(' ')
      return fullName || result.email || ''
    }
    return result.name ?? ''
  }

  function getDisplayName(result: SearchResult) {
    if (result.type === 'USER') {
      return [result.firstName, result.lastName].filter(Boolean).join(' ') || 'Unknown User'
    }
    return result.name ?? result.assetTag ?? result.id
  }

  function handleResultClick(result: SearchResult) {
    router.push(result.href)
    closeModal()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm tài sản, người dùng, license..."
            className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          />
          {isLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
          <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded transition">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto py-2">
            {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                      index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{getDisplayName(result)}</div>
                      <div className="text-xs text-gray-500 truncate">{getSubtitle(result)}</div>
                    </div>
                    <span className="text-xs text-gray-400 uppercase">{result.type}</span>
                  </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !isLoading && (
          <div className="py-8 text-center text-gray-500">
            Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
          </div>
        )}

        {query.length < 2 && (
          <div className="py-6 text-center text-gray-400 text-sm">
            Nhập ít nhất 2 ký tự để tìm kiếm
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Enter</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  )
}
