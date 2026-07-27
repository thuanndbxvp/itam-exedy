/**
 * /api/reports/it-costs — Sprint C.1.
 *
 * GET ?startDate=ISO&endDate=ISO → { summary, details }.
 *
 * Permission: `reports.view`.
 *
 * Data sources:
 *  - Asset.purchaseCost (purchaseDate between range)
 *  - License.purchaseCost (purchaseDate between range)
 *  - AssetMaintenance.cost (startDate between range; fallback completionDate)
 */
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { ValidationError } from '@/lib/errors'

interface AssetRow {
  source: 'ASSET'
  id: string
  date: Date
  description: string
  amount: number
  meta?: Record<string, unknown>
}

interface LicenseRow {
  source: 'LICENSE'
  id: string
  date: Date
  description: string
  amount: number
  meta?: Record<string, unknown>
}

interface MaintenanceRow {
  source: 'MAINTENANCE'
  id: string
  date: Date
  description: string
  amount: number
  meta?: Record<string, unknown>
}

type CostRow = AssetRow | LicenseRow | MaintenanceRow

const DEFAULT_RANGE_DAYS = 90

export async function GET(req: NextRequest) {
  try {
    await requirePermissionApi('reports.view')

    const url = new URL(req.url)
    const startStr = url.searchParams.get('startDate')
    const endStr = url.searchParams.get('endDate')

    const now = new Date()
    let start: Date
    let end: Date

    if (startStr && endStr) {
      start = new Date(startStr)
      end = new Date(endStr)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('startDate/endDate không hợp lệ.')
      }
      if (start > end) {
        throw new ValidationError('startDate phải ≤ endDate.')
      }
    } else {
      // Default: 90 ngày qua → hiện tại
      end = now
      start = new Date(now.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000)
    }

    const [assets, licenses, maintenances] = await Promise.all([
      prisma.asset.findMany({
        where: {
          deletedAt: null,
          purchaseDate: { gte: start, lte: end },
          purchaseCost: { not: null },
        },
        select: {
          id: true,
          name: true,
          assetTag: true,
          purchaseDate: true,
          purchaseCost: true,
        },
      }),
      prisma.license.findMany({
        where: {
          deletedAt: null,
          purchaseDate: { gte: start, lte: end },
          purchaseCost: { not: null },
        },
        select: {
          id: true,
          name: true,
          purchaseDate: true,
          purchaseCost: true,
        },
      }),
      prisma.assetMaintenance.findMany({
        where: {
          deletedAt: null,
          OR: [
            { startDate: { gte: start, lte: end } },
            { completionDate: { gte: start, lte: end } },
          ],
          cost: { not: null },
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          completionDate: true,
          cost: true,
          asset: { select: { assetTag: true, name: true } },
        },
      }),
    ])

    const rows: CostRow[] = []

    for (const a of assets) {
      if (!a.purchaseCost || !a.purchaseDate) continue
      rows.push({
        source: 'ASSET',
        id: a.id,
        date: a.purchaseDate,
        description: `${a.assetTag} — ${a.name}`,
        amount: Number(a.purchaseCost),
      })
    }
    for (const l of licenses) {
      if (!l.purchaseCost || !l.purchaseDate) continue
      rows.push({
        source: 'LICENSE',
        id: l.id,
        date: l.purchaseDate,
        description: l.name,
        amount: Number(l.purchaseCost),
      })
    }
    for (const m of maintenances) {
      if (!m.cost) continue
      const date = m.startDate ?? m.completionDate
      if (!date) continue
      rows.push({
        source: 'MAINTENANCE',
        id: m.id,
        date,
        description: m.asset
          ? `${m.title} (${m.asset.assetTag} — ${m.asset.name})`
          : m.title,
        amount: Number(m.cost),
      })
    }

    // Sort desc
    rows.sort((a, b) => b.date.getTime() - a.date.getTime())

    const assetCost = rows
      .filter((r) => r.source === 'ASSET')
      .reduce((s, r) => s + r.amount, 0)
    const licenseCost = rows
      .filter((r) => r.source === 'LICENSE')
      .reduce((s, r) => s + r.amount, 0)
    const maintenanceCost = rows
      .filter((r) => r.source === 'MAINTENANCE')
      .reduce((s, r) => s + r.amount, 0)
    const totalCost = assetCost + licenseCost + maintenanceCost

    return okResponse({
      range: { startDate: start.toISOString(), endDate: end.toISOString() },
      summary: { assetCost, licenseCost, maintenanceCost, totalCost },
      details: rows.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        type: r.source,
        description: r.description,
        amount: r.amount,
      })),
    })
  } catch (e) {
    return errorResponse(e)
  }
}
