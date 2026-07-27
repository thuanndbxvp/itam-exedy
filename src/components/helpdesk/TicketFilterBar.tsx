'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Filter, X } from 'lucide-react'

export type PriorityFilter = '' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface TeamLite {
  id: string
  name: string
}

interface UserLite {
  id: string
  firstName: string
  lastName: string | null
}

interface Props {
  teams: TeamLite[]
  assignees: UserLite[]
  showTeamFilter: boolean
  showAssigneeFilter: boolean
}

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string; color: string }[] = [
  { value: '', label: 'Tất cả', color: '' },
  { value: 'LOW', label: 'Thấp', color: 'bg-gray-100 text-gray-700' },
  { value: 'MEDIUM', label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HIGH', label: 'Cao', color: 'bg-orange-100 text-orange-700' },
  { value: 'URGENT', label: 'Khẩn cấp', color: 'bg-red-100 text-red-700' },
]

/**
 * TicketFilterBar — filter tickets by priority / team / assignee via URL searchParams.
 *
 * Pattern: write to URL → Server Component re-fetches with new filters.
 * Aligns with LicenseFilterBar (A1) pattern.
 */
export default function TicketFilterBar({ teams, assignees, showTeamFilter, showAssigneeFilter }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentPriority = (searchParams.get('priority') ?? '') as PriorityFilter
  const currentTeamId = searchParams.get('teamId') ?? ''
  const currentAssigneeId = searchParams.get('assigneeId') ?? ''

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => {
      router.replace(`/helpdesk?${params.toString()}`)
    })
  }

  function clearAll() {
    const params = new URLSearchParams()
    const tab = searchParams.get('tab')
    if (tab) params.set('tab', tab)
    startTransition(() => {
      router.replace(`/helpdesk${params.toString() ? '?' + params.toString() : ''}`)
    })
  }

  const hasFilter = currentPriority !== '' || currentTeamId !== '' || currentAssigneeId !== ''

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 flex-wrap shadow-sm">
      <Filter size={16} className="text-gray-400" />

      {/* Priority pills */}
      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
        {PRIORITY_OPTIONS.map((p) => {
          const active = currentPriority === p.value
          return (
            <button
              key={p.value}
              onClick={() => updateParam('priority', p.value)}
              disabled={isPending}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                active
                  ? p.value
                    ? `${p.color} shadow-sm`
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {showTeamFilter && teams.length > 0 && (
        <select
          value={currentTeamId}
          onChange={(e) => updateParam('teamId', e.target.value)}
          disabled={isPending}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tất cả team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}

      {showAssigneeFilter && assignees.length > 0 && (
        <select
          value={currentAssigneeId}
          onChange={(e) => updateParam('assigneeId', e.target.value)}
          disabled={isPending}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tất cả người xử lý</option>
          {assignees.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName}{u.lastName ? ` ${u.lastName}` : ''}
            </option>
          ))}
        </select>
      )}

      {hasFilter && (
        <button
          onClick={clearAll}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2"
        >
          <X size={12} />
          Xóa bộ lọc
        </button>
      )}
    </div>
  )
}