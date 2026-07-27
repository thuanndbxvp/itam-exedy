/**
 * /api/notification-channels — Sprint C9.
 *
 * GET    : List (ADMIN/IT_MANAGER).
 * POST   : Create new channel (name, kind, url, filterKinds, enabled).
 * DELETE : Body { id } → soft delete.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { ForbiddenError, ValidationError, NotFoundError } from '@/lib/errors'

const Body = z.object({
  name: z.string().min(1).max(100).trim(),
  kind: z.enum(['SLACK', 'WEBHOOK']),
  url: z.string().url().max(1000),
  filterKinds: z.array(z.string()).optional().default([]),
  enabled: z.boolean().optional().default(true),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'IT_MANAGER') {
      throw new ForbiddenError('Chỉ ADMIN/IT_MANAGER mới có quyền.')
    }

    const channels = await prisma.notificationChannel.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        kind: true,
        enabled: true,
        filterKinds: true,
        lastDeliveryAt: true,
        lastDeliveryError: true,
        createdAt: true,
      },
    })

    return okResponse({
      channels: channels.map((c) => ({
        ...c,
        lastDeliveryAt: c.lastDeliveryAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'IT_MANAGER') {
      throw new ForbiddenError('Chỉ ADMIN/IT_MANAGER mới có quyền.')
    }

    const json = await req.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) throw new ValidationError('Dữ liệu không hợp lệ.')

    const channel = await prisma.notificationChannel.create({
      data: {
        name: parsed.data.name,
        kind: parsed.data.kind,
        url: parsed.data.url,
        filterKinds: parsed.data.filterKinds,
        enabled: parsed.data.enabled,
        createdById: session.user.id,
      },
    })

    return okResponse({ channel })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'IT_MANAGER') {
      throw new ForbiddenError('Chỉ ADMIN/IT_MANAGER mới có quyền.')
    }
    const json = (await req.json().catch(() => null)) as { id?: string } | null
    if (!json?.id) throw new ValidationError('Thiếu id.')

    const existing = await prisma.notificationChannel.findUnique({ where: { id: json.id } })
    if (!existing) throw new NotFoundError('NotificationChannel', json.id)

    await prisma.notificationChannel.update({
      where: { id: json.id },
      data: { deletedAt: new Date(), enabled: false },
    })

    return okResponse({ deleted: json.id })
  } catch (e) {
    return errorResponse(e)
  }
}
