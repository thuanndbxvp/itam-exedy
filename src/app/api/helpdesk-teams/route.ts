/**
 * /api/helpdesk-teams — A7
 *
 * GET    : List all teams (active) — IT staff.
 * POST   : Tạo team mới + gán members. Permission: helpdesk.manage_teams.
 * PUT    : Update team + replace members.
 * DELETE : Soft-delete (set isActive=false) + verify no open tickets.
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

export async function GET() {
  try {
    await requirePermissionApi('helpdesk.view')
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { members: true, tickets: true } },
      },
    })
    return okResponse(teams)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermissionApi('helpdesk.manage_teams')
    const body = await req.json()
    const { name, description, category, leadId, userIds, isActive } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Tên team là bắt buộc.' },
        { status: 400 },
      )
    }

    const slug = slugify(name)
    if (!slug) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Tên team không tạo được slug hợp lệ.' },
        { status: 400 },
      )
    }

    const existing = await prisma.team.findFirst({
      where: { OR: [{ name }, { slug }] },
    })
    if (existing) {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', message: 'Tên team hoặc slug đã tồn tại.' },
        { status: 409 },
      )
    }

    // Validate userIds
    let validUserIds: string[] = []
    if (Array.isArray(userIds) && userIds.length > 0) {
      const found = await prisma.user.findMany({
        where: { id: { in: userIds }, deletedAt: null },
        select: { id: true },
      })
      validUserIds = found.map((u) => u.id)
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        category: category ?? null,
        leadId: leadId || null,
        isActive: isActive !== false,
        members: validUserIds.length > 0
          ? {
              create: validUserIds.map((uid) => ({
                userId: uid,
                isLead: uid === leadId,
              })),
            }
          : undefined,
      },
      include: {
        _count: { select: { members: true, tickets: true } },
      },
    })

    // Note: ItemType enum không có TEAM value → skip audit log cho A7 MVP.
    // TODO: Migrate ItemType để thêm TEAM khi cần tracking lâu dài.

    return okResponse(team)
  } catch (e) {
    return errorResponse(e)
  }
}