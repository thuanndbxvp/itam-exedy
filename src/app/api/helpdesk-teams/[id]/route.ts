/**
 * /api/helpdesk-teams/[id] — A7
 *
 * PUT    : Update team (name/description/category/leadId/isActive + replace members).
 * DELETE : Soft-delete (set isActive=false). Block nếu còn ticket OPEN.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('helpdesk.manage_teams')
    const { id } = await params
    const body = await req.json()
    const { name, description, category, leadId, userIds, isActive } = body

    const existing = await prisma.team.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy team.' },
        { status: 404 },
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Tên team là bắt buộc.' },
        { status: 400 },
      )
    }

    if (name !== existing.name) {
      const slug = slugify(name)
      const dup = await prisma.team.findFirst({
        where: { OR: [{ name }, { slug }], NOT: { id } },
      })
      if (dup) {
        return NextResponse.json(
          { ok: false, code: 'CONFLICT', message: 'Tên team hoặc slug đã được sử dụng.' },
          { status: 409 },
        )
      }
    }

    // Validate userIds
    let validUserIds: string[] = []
    if (Array.isArray(userIds)) {
      if (userIds.length > 0) {
        const found = await prisma.user.findMany({
          where: { id: { in: userIds }, deletedAt: null },
          select: { id: true },
        })
        validUserIds = found.map((u) => u.id)
      }
    } else {
      // Không truyền userIds → giữ nguyên members cũ
      const current = await prisma.teamMember.findMany({ where: { teamId: id }, select: { userId: true } })
      validUserIds = current.map((m) => m.userId)
    }

    const slug = slugify(name)
    const updated = await prisma.$transaction(async (tx) => {
      // Replace members
      await tx.teamMember.deleteMany({ where: { teamId: id } })
      if (validUserIds.length > 0) {
        await tx.teamMember.createMany({
          data: validUserIds.map((uid) => ({
            teamId: id,
            userId: uid,
            isLead: uid === leadId,
          })),
        })
      }

      return tx.team.update({
        where: { id },
        data: {
          name: name.trim(),
          slug,
          description: description?.trim() || null,
          category: category ?? null,
          leadId: leadId || null,
          isActive: isActive !== false,
        },
        include: {
          _count: { select: { members: true, tickets: true } },
        },
      })
    })

    return okResponse(updated)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('helpdesk.manage_teams')
    const { id } = await params

    const existing = await prisma.team.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy team.' },
        { status: 404 },
      )
    }

    // Block xóa nếu còn ticket OPEN
    const openTickets = await prisma.ticket.count({
      where: {
        teamId: id,
        status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING'] },
      },
    })
    if (openTickets > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_STATE',
          message: `Còn ${openTickets} ticket đang mở gán cho team này. Đóng/xử lý hết trước khi xóa.`,
        },
        { status: 409 },
      )
    }

    // Soft-delete: set isActive=false (giữ data cho tickets lịch sử)
    await prisma.team.update({
      where: { id },
      data: { isActive: false },
    })

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}