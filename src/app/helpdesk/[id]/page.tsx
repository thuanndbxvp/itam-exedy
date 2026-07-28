'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  Lock,
  AlertCircle,
  Clock,
} from 'lucide-react'
import TicketAttachments from '@/components/helpdesk/TicketAttachments'
import { useToast } from '@/components/Toast'
import Modal from '@/components/ui/Modal'

interface Comment {
  id: string
  authorId: string
  content: string
  isInternal: boolean
  createdAt: string
  author: { id: string; firstName: string; lastName: string | null }
}

interface Ticket {
  id: string
  code: string
  title: string
  description: string
  type: string
  status: string
  priority: string
  category: string
  reporterId: string
  assigneeId: string | null
  teamId: string | null
  reportedAssetId: string | null
  reportedAsset: { id: string; assetTag: string; name: string } | null
  reportedLicenseSeat: { id: string; license: { id: string; name: string } } | null
  reporter: { id: string; firstName: string; lastName: string | null; email: string | null }
  assignee: { id: string; firstName: string; lastName: string | null; email: string | null } | null
  closedBy: { id: string; firstName: string; lastName: string | null } | null
  team: { id: string; name: string; slug: string } | null
  slaDueAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  comments: Comment[]
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới',
  ASSIGNED: 'Đã giao',
  IN_PROGRESS: 'Đang xử lý',
  PENDING: 'Tạm chờ',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
  REJECTED: 'Bị từ chối',
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
}

const CATEGORY_LABELS: Record<string, string> = {
  HARDWARE: 'Phần cứng',
  SOFTWARE: 'Phần mềm',
  NETWORK: 'Mạng',
  ACCOUNT: 'Tài khoản',
  OTHER: 'Khác',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.id as string
  const { data: session } = useSession()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [myPerms, setMyPerms] = useState<string[]>([])
  const [showReassign, setShowReassign] = useState(false)
  const [itUsers, setItUsers] = useState<any[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const { show } = useToast()
  const [confirmAction, setConfirmAction] = useState<{ type: 'claim' | 'close' | 'reopen' | 'reassign'; label: string } | null>(null)

  const isIt =
    session?.user?.role === 'IT_STAFF' ||
    session?.user?.role === 'IT_MANAGER' ||
    session?.user?.role === 'ADMIN'

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/tickets/by-code/${encodeURIComponent(code)}`, { cache: 'no-store' }),
        fetch('/api/me/permissions', { cache: 'no-store' })
      ])
      const json = await r1.json()
      const permJson = await r2.json()
      if (json.ok) {
        setTicket(json.data.ticket)
      } else {
        setError(json.message ?? 'Không tìm thấy ticket.')
      }
      if (permJson.ok) {
        setMyPerms(permJson.data.permissions || [])
      }
    } catch {
      setError('Lỗi kết nối.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!ticket || commentText.trim().length === 0) return
    setSubmitting(true)
    try {
      const r = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim(), isInternal }),
      })
      const json = await r.json()
      if (json.ok) {
        setCommentText('')
        setIsInternal(false)
        // Reload full ticket to get fresh comments
        await load()
      } else {
        setError(json.message ?? 'Gửi comment thất bại.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function doAction(action: 'claim' | 'close' | 'reopen') {
    if (!ticket) return
    setConfirmAction({ type: action, label: actionLabel(action) })
  }

  async function handleConfirmAction() {
    const type = confirmAction?.type
    if (!ticket || !type) return
    setConfirmAction(null)
    setActionLoading(true)
    try {
      const r = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: type }),
      })
      const json = await r.json()
      if (json.ok) {
        await load()
      } else {
        setError(json.message ?? 'Thao tác thất bại.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function doReassign() {
    if (!ticket || !selectedAssignee) return
    setConfirmAction({ type: 'reassign', label: 'chuyển ticket' })
  }

  async function handleConfirmReassign() {
    const type = confirmAction?.type
    if (!ticket || type !== 'reassign') return
    setConfirmAction(null)
    setActionLoading(true)
    try {
      const r = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'reassign', assigneeId: selectedAssignee }),
      })
      const json = await r.json()
      if (json.ok) {
        setShowReassign(false)
        await load()
      } else {
        setError(json.message ?? 'Chuyển ticket thất bại.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function openReassign() {
    setShowReassign(true)
    if (itUsers.length === 0) {
      try {
        const r = await fetch('/api/settings/users')
        const json = await r.json()
        if (json.ok) {
          const eligible = json.data.filter((u: any) => u.role !== 'EMPLOYEE')
          setItUsers(eligible)
          if (eligible.length > 0) setSelectedAssignee(eligible[0].id)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  function actionLabel(a: string) {
    if (a === 'claim') return 'Nhận xử lý ticket này'
    if (a === 'close') return 'Đóng ticket'
    if (a === 'reopen') return 'Mở lại ticket'
    return a
  }

  if (loading && !ticket) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Đang tải...
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link href="/helpdesk" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} className="mr-1" /> Quay lại
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error ?? 'Không tìm thấy ticket.'}
        </div>
      </div>
    )
  }

  const canClaim = isIt && ticket.status === 'NEW' && !ticket.assigneeId
  const canClose = ticket.status !== 'CLOSED' && (ticket.reporterId === session?.user?.id || isIt)
  const canReopen = isIt && (ticket.status === 'CLOSED' || ticket.status === 'REJECTED')
  const canReassign = myPerms.includes('helpdesk.reassign') && ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/helpdesk"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} className="mr-1" /> Quay lại
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-blue-600 font-medium">{ticket.code}</span>
              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${PRIORITY_COLORS[ticket.priority]}`}>
                {ticket.priority}
              </span>
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${STATUS_COLORS[ticket.status]}`}>
                {STATUS_LABELS[ticket.status] ?? ticket.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{ticket.title}</h2>
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Loại</div>
            <div className="mt-1 text-gray-900">{ticket.type}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Phân loại</div>
            <div className="mt-1 text-gray-900">{CATEGORY_LABELS[ticket.category] ?? ticket.category}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Người báo</div>
            <div className="mt-1 text-gray-900">
              {ticket.reporter.firstName} {ticket.reporter.lastName ?? ''}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Phụ trách</div>
            <div className="mt-1 text-gray-900">
              {ticket.assignee
                ? `${ticket.assignee.firstName} ${ticket.assignee.lastName ?? ''}`
                : ticket.team
                ? ticket.team.name
                : '—'}
            </div>
          </div>
          {ticket.reportedAsset && (
            <div className="col-span-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Tài sản</div>
              <Link
                href={`/assets/${ticket.reportedAsset.id}`}
                className="mt-1 text-blue-600 hover:underline font-mono text-sm"
              >
                {ticket.reportedAsset.assetTag} — {ticket.reportedAsset.name}
              </Link>
            </div>
          )}
          {ticket.reportedLicenseSeat && (
            <div className="col-span-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider">License</div>
              <div className="mt-1 text-gray-900">{ticket.reportedLicenseSeat.license.name}</div>
            </div>
          )}
          {ticket.slaDueAt && (
            <div className="col-span-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} /> SLA
              </div>
              <div className="mt-1 text-gray-900">
                {new Date(ticket.slaDueAt).toLocaleString('vi-VN')}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {(canClaim || canClose || canReopen || canReassign) && (
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
            {canClaim && (
              <button
                onClick={() => doAction('claim')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                <UserCheck size={14} /> Nhận xử lý
              </button>
            )}
            {canReassign && !showReassign && (
              <button
                onClick={openReassign}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                <UserCheck size={14} /> Chuyển ticket
              </button>
            )}
            {canClose && (
              <button
                onClick={() => doAction('close')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                <CheckCircle2 size={14} /> Đóng ticket
              </button>
            )}
            {canReopen && (
              <button
                onClick={() => doAction('reopen')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-gray-600 hover:bg-gray-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                <RotateCcw size={14} /> Mở lại
              </button>
            )}

            {/* Reassign select */}
            {showReassign && (
              <div className="flex items-center gap-2 ml-auto p-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm outline-none min-w-[200px]"
                >
                  {itUsers.length === 0 && <option value="">Đang tải...</option>}
                  {itUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={doReassign}
                  disabled={actionLoading || !selectedAssignee}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-60"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => setShowReassign(false)}
                  className="text-gray-500 hover:text-gray-700 px-2 py-1.5 text-sm font-medium"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comment form */}
      <form onSubmit={postComment} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Phản hồi cho ticket này…"
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
        />
        <div className="mt-2 flex items-center justify-between">
          {isIt ? (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded text-blue-600"
              />
              <Lock size={12} /> Comment nội bộ (chỉ IT thấy)
            </label>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={submitting || commentText.trim().length === 0}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Gửi
          </button>
        </div>
      </form>

      {/* Timeline */}
      <div className="space-y-3">
        {ticket.comments.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-xl shadow-sm border p-4 ${
              c.isInternal ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                {c.author.firstName.charAt(0)}
                {c.author.lastName?.charAt(0) ?? ''}
              </div>
              <span className="font-medium text-sm text-gray-900">
                {c.author.firstName} {c.author.lastName ?? ''}
              </span>
              {c.isInternal && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  <Lock size={10} /> Nội bộ
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(c.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
          </div>
        ))}
      </div>

      {/* Attachments */}
      <TicketAttachments ticketId={ticket.id} />

      {/* Confirm action modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Xác nhận thao tác"
      >
        <p className="text-gray-600 mb-4">
          {confirmAction?.type === 'reassign'
            ? 'Xác nhận chuyển ticket này cho nhân sự khác?'
            : `Xác nhận: ${confirmAction?.label}?`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmAction(null)}
            disabled={actionLoading}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={confirmAction?.type === 'reassign' ? handleConfirmReassign : handleConfirmAction}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </Modal>
    </div>
  )
}