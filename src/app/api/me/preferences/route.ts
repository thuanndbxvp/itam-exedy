/**
 * /api/me/preferences — GET current user preferences.
 *
 * Auth: chỉ cần authenticated user (self).
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'AUTH', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }

    let pref = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    })
    if (!pref) {
      pref = await prisma.userPreference.create({
        data: { userId: session.user.id },
      })
    }

    return okResponse({
      emailDigestFrequency: pref.emailDigestFrequency,
      muteUntil: pref.muteUntil,
      theme: pref.theme,
      locale: pref.locale,
    })
  } catch (e) {
    return errorResponse(e)
  }
}