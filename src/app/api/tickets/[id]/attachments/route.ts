/**
 * /api/tickets/[id]/attachments — Sprint C2.
 *
 * GET    : List attachments của ticket.
 * POST   : Upload 1 file attachment (multipart/form-data). Reuses `lib/upload.ts`.
 * DELETE : Xóa attachment theo id. Body: { attachmentId }. Chỉ uploader hoặc IT side.
 *
 * Permission xem ticket: reuse `canViewTicket()` từ `lib/tickets/permissions.ts`.
 */
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requireUser, canViewTicket } from '@/lib/tickets/permissions'
import { uploadFile } from '@/lib/upload'
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors'
import { getActorUserId } from '@/lib/audit'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const user = await requireUser()

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, reporterId: true, assigneeId: true, teamId: true },
    })
    if (!ticket) throw new NotFoundError('Ticket', id)
    if (!canViewTicket(user, ticket)) throw new NotFoundError('Ticket', id)

    const attachments = await prisma.ticketAttachment.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return okResponse({ attachments })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const user = await requireUser()

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, reporterId: true, assigneeId: true, teamId: true },
    })
    if (!ticket) throw new NotFoundError('Ticket', id)
    if (!canViewTicket(user, ticket)) throw new NotFoundError('Ticket', id)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) throw new ValidationError('File là bắt buộc.')

    // Upload via stub → returns data-URI for MVP
    const result = await uploadFile({
      file,
      type: 'ticket-attachment',
      entityId: id,
    })
    if (!result.ok || !result.url) {
      throw new ValidationError(result.error ?? 'Upload lỗi.')
    }

    // Create attachment record (lưu data-URI vào `storedPath`, cho Phase sau chuyển sang thật)
    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: id,
        filename: file.name,
        storedPath: result.url,
        mimeType: file.type,
        size: file.size,
        uploaderId: user.id,
      },
    })

    return okResponse({ attachment })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const user = await requireUser()

    const json = (await req.json().catch(() => null)) as { attachmentId?: string } | null
    if (!json?.attachmentId) throw new ValidationError('Thiếu attachmentId.')

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, reporterId: true, assigneeId: true, teamId: true },
    })
    if (!ticket) throw new NotFoundError('Ticket', id)
    if (!canViewTicket(user, ticket)) throw new NotFoundError('Ticket', id)

    const att = await prisma.ticketAttachment.findUnique({
      where: { id: json.attachmentId },
      select: { id: true, ticketId: true, uploaderId: true },
    })
    if (!att) throw new NotFoundError('Attachment', json.attachmentId)
    if (att.ticketId !== id) throw new ValidationError('Attachment không thuộc ticket này.')

    // Chỉ uploader hoặc IT side (ADMIN/IT_MANAGER/IT_STAFF) mới xóa được
    const isUploader = att.uploaderId === user.id
    const isItSide =
      user.role === 'ADMIN' ||
      user.role === 'IT_MANAGER' ||
      user.role === 'IT_STAFF'
    if (!isUploader && !isItSide) {
      throw new ForbiddenError('Chỉ người upload hoặc IT mới có quyền xóa file.')
    }

    await prisma.ticketAttachment.delete({ where: { id: att.id } })

    // Audit log
    const actorId = await getActorUserId(user.id)
    await prisma.actionLog.create({
      data: {
        actionType: 'DELETE',
        itemType: 'TICKET_ATTACHMENT',
        itemId: att.id,
        userId: actorId,
        notes: `Xóa file đính kèm ticket`,
      },
    })

    return okResponse({ deleted: att.id })
  } catch (e) {
    return errorResponse(e)
  }
}
