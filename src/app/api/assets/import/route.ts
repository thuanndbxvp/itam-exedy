import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-guard'
import { getActorUserId } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface CSVRow {
  assetTag: string
  name: string
  serial?: string
  model?: string
  category?: string
  notes?: string
}

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN')
  } catch {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }, { status: 403 })
  }

  const session = await getServerSession(authOptions)
  const actorId = await getActorUserId(session?.user?.id ?? null)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'File CSV là bắt buộc.' },
      { status: 400 }
    )
  }

  if (!file.name.endsWith('.csv')) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'Chỉ chấp nhận file CSV.' },
      { status: 400 }
    )
  }

  // Giới hạn file size: 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'File CSV vượt quá 5MB.' },
      { status: 400 }
    )
  }

  const text = await file.text()
  const lines = text.split('\n').filter((line) => line.trim())

  if (lines.length < 2) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'File CSV phải có header và ít nhất 1 row dữ liệu.' },
      { status: 400 }
    )
  }

  if (lines.length > 1001) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'File CSV vượt quá 1000 rows. Chia thành nhiều file.' },
      { status: 400 }
    )
  }

  // Parse CSV — simple split (không handle quoted commas trong MSEW vì format đơn giản)
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const requiredHeaders = ['assettag', 'name']
  const missingHeaders = requiredHeaders.filter((h) => !header.includes(h))

  if (missingHeaders.length > 0) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: `Thiếu columns bắt buộc: ${missingHeaders.join(', ')}` },
      { status: 400 }
    )
  }

  const rows: CSVRow[] = []
  const errors: { row: number; message: string }[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: Partial<CSVRow> = {}

    header.forEach((col, idx) => {
      ;(row as Record<string, string>)[col] = values[idx] || ''
    })

    if (!row.assetTag || !row.name) {
      errors.push({ row: i + 1, message: 'assetTag và name là bắt buộc.' })
      continue
    }

    rows.push(row as CSVRow)
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'Không có row nào hợp lệ để import.' },
      { status: 400 }
    )
  }

  // Find default deployable status
  const defaultStatus = await prisma.statusLabel.findFirst({
    where: { deployable: true, pending: false, archived: false },
  })

  if (!defaultStatus) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'Không tìm thấy Status "Sẵn sàng cấp phát". Hãy tạo trước ở /settings/statuses.' },
      { status: 400 }
    )
  }

  // Pre-load all models and categories by name for fast lookup
  const [allModels, allCategories] = await Promise.all([
    prisma.assetModel.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ])
  const modelByName = new Map(allModels.map((m) => [m.name.toLowerCase(), m.id]))
  const categoryByName = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]))

  // Import rows
  let success = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const existing = await prisma.asset.findUnique({
        where: { assetTag: row.assetTag },
      })

      if (existing) {
        errors.push({ row: i + 2, message: `assetTag "${row.assetTag}" đã tồn tại.` })
        continue
      }

      const modelId = row.model ? (modelByName.get(row.model.toLowerCase()) ?? null) : null
      const categoryId = row.category ? (categoryByName.get(row.category.toLowerCase()) ?? null) : null

      const asset = await prisma.asset.create({
        data: {
          assetTag: row.assetTag,
          name: row.name,
          serial: row.serial || null,
          modelId,
          categoryId,
          statusId: defaultStatus.id,
          notes: row.notes || null,
        },
      })

      await prisma.actionLog.create({
        data: {
          actionType: 'CREATE',
          itemType: 'ASSET',
          itemId: asset.id,
          userId: actorId,
          notes: `Import từ CSV: tạo asset "${row.assetTag}"`,
        },
      })

      success++
    } catch (e) {
      errors.push({ row: i + 2, message: (e as Error).message })
    }
  }

  revalidatePath('/assets')

  const result: ImportResult = {
    total: rows.length,
    success,
    failed: rows.length - success,
    errors: errors.slice(0, 20),
  }

  return NextResponse.json({ ok: true, data: result })
}
