import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ForbiddenError } from '@/lib/errors'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session?.user?.role !== 'ADMIN') throw new ForbiddenError('Chỉ ADMIN.')
}

export async function GET() {
  try { await requireAdmin() } catch (e) {
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: e instanceof Error ? e.message : '' }, { status: 403 })
  }
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ ok: true, data: cats })
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch (e) {
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: e instanceof Error ? e.message : '' }, { status: 403 })
  }
  const { name, categoryType, color } = await req.json()
  if (!name?.trim()) return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên không được trống.' }, { status: 400 })
  const cat = await prisma.category.create({ data: { name, categoryType: categoryType || 'ASSET', color: color || null } })
  return NextResponse.json({ ok: true, data: cat }, { status: 201 })
}
