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
    return NextResponse.json({ ok: false, code, message: '' }, { status: 403 })
  }
  const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ ok: true, data: companies })
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch (e) {
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: '' }, { status: 403 })
  }
  const { name, notes } = await req.json()
  if (!name?.trim()) return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên không được trống.' }, { status: 400 })
  try {
    const company = await prisma.company.create({ data: { name, notes: notes || null } })
    return NextResponse.json({ ok: true, data: company }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Tên công ty đã tồn tại.' }, { status: 409 })
  }
}
