'use server'

/**
 * EULA server actions — Sprint C3.
 */

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runCommand } from '@/lib/commands/runCommand'
import { DomainError, type CommandResult } from '@/lib/errors'
import { eulaVersion } from '@/lib/eula'

/**
 * Accept EULA cho category.
 * Idempotent: nếu user đã accept version hiện tại → không ghi thêm.
 * Nếu version khác (admin đã edit EULA) → upsert version mới.
 */
export async function acceptEulaCmd(input: {
  categoryId: string
}): Promise<CommandResult<{ acceptedAt: string }>> {
  return runCommand(async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new DomainError('UNAUTHORIZED', 'Bạn chưa đăng nhập.')
    }
    const userId = session.user.id
    const { categoryId } = input

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, eulaText: true, requireAcceptance: true },
    })
    if (!category) {
      throw new DomainError('NOT_FOUND', `Category ${categoryId} không tồn tại.`)
    }
    if (!category.requireAcceptance) {
      throw new DomainError(
        'VALIDATION',
        'Category này không yêu cầu chấp nhận EULA.'
      )
    }
    if (!category.eulaText || category.eulaText.trim() === '') {
      throw new DomainError(
        'VALIDATION',
        'Category chưa có nội dung EULA. Liên hệ admin.'
      )
    }

    const version = eulaVersion(category.eulaText)

    // Capture IP
    let ipAddress: string | null = null
    try {
      const hdrs = await headers()
      ipAddress =
        hdrs.get('x-forwarded-for')?.split(',')[0].trim() ??
        hdrs.get('x-real-ip') ??
        null
    } catch {
      // ignore
    }

    const accepted = await prisma.eulaAcceptance.upsert({
      where: { userId_categoryId: { userId, categoryId } },
      create: {
        userId,
        categoryId,
        version,
        ipAddress,
      },
      update: {
        version,
        acceptedAt: new Date(),
        ipAddress,
      },
    })

    revalidatePath('/assets')
    return { acceptedAt: accepted.acceptedAt.toISOString() }
  }, 'acceptEulaCmd')
}

/**
 * Check user đã accept EULA của category chưa (và version hiện tại).
 * Returns: { accepted: bool, currentVersion: string }
 */
export async function checkEulaStatus(input: {
  userId: string
  categoryId: string
}): Promise<{ accepted: boolean; currentVersion: string }> {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { eulaText: true },
  })
  const currentVersion = eulaVersion(category?.eulaText)

  const existing = await prisma.eulaAcceptance.findUnique({
    where: {
      userId_categoryId: {
        userId: input.userId,
        categoryId: input.categoryId,
      },
    },
  })

  return {
    accepted: existing?.version === currentVersion && currentVersion !== '',
    currentVersion,
  }
}
