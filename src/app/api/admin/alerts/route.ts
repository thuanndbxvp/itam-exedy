/**
 * GET /api/admin/alerts
 *
 * Tổng hợp cảnh báo chủ động cho Admin Dashboard:
 *   - expiringLicenses: License có expirationDate trong vòng 30 ngày tới (hoặc đã hết hạn nhưng reassignable=true)
 *   - eolAssets: Asset có assetEolDate trong vòng 60 ngày tới (hoặc đã qua)
 *   - maintenanceDue: Asset có purchaseDate cũ (> depreciation months) cần review khấu hao
 *
 * Auth: ADMIN only.
 */
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

const LICENSE_WINDOW_DAYS = 30
const ASSET_EOL_WINDOW_DAYS = 60

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET() {
  try {
    await requirePermissionApi('reports.view')

    const now = new Date()
    const licenseCutoff = new Date(now.getTime() + LICENSE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const assetEolCutoff = new Date(now.getTime() + ASSET_EOL_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    const [
      expiringLicenses,
      eolAssets,
      maintenanceCandidates,
    ] = await Promise.all([
      // License sắp hết hạn (trong 30 ngày)
      prisma.license.findMany({
        where: {
          deletedAt: null,
          expirationDate: {
            not: null,
            lte: licenseCutoff,
          },
        },
        select: {
          id: true,
          name: true,
          expirationDate: true,
          maintained: true,
          _count: { select: { seats: { where: { deletedAt: null } } } },
        },
        orderBy: { expirationDate: 'asc' },
        take: 20,
      }),
      // Asset sắp tới EOL (trong 60 ngày)
      prisma.asset.findMany({
        where: {
          deletedAt: null,
          assetEolDate: {
            not: null,
            lte: assetEolCutoff,
          },
        },
        select: {
          id: true,
          assetTag: true,
          name: true,
          assetEolDate: true,
          purchaseDate: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { assetEolDate: 'asc' },
        take: 20,
      }),
      // Asset cần review khấu hao (purchaseDate cũ + có depreciation record với months)
      prisma.asset.findMany({
        where: {
          deletedAt: null,
          purchaseDate: { not: null },
          depreciation: { isNot: null },
          status: { archived: false },
        },
        select: {
          id: true,
          assetTag: true,
          name: true,
          purchaseDate: true,
          depreciation: { select: { id: true, name: true, months: true } },
        },
        take: 200,
      }),
    ])

    // Filter maintenance: purchaseDate + depreciation.months < now
    const maintenanceDue: Array<{
      id: string
      assetTag: string
      name: string
      purchaseDate: string
      depreciationMonths: number
      ageMonths: number
    }> = []
    for (const a of maintenanceCandidates) {
      if (!a.purchaseDate || !a.depreciation?.months) continue
      const months = (now.getTime() - a.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
      if (months >= a.depreciation.months) {
        maintenanceDue.push({
          id: a.id,
          assetTag: a.assetTag,
          name: a.name,
          purchaseDate: a.purchaseDate.toISOString(),
          depreciationMonths: a.depreciation.months,
          ageMonths: Math.floor(months),
        })
      }
    }
    maintenanceDue.sort((a, b) => b.ageMonths - a.ageMonths)

    const data = {
      expiringLicenses: expiringLicenses.map((l) => ({
        id: l.id,
        name: l.name,
        expirationDate: l.expirationDate?.toISOString() ?? null,
        daysUntilExpiry: l.expirationDate ? daysBetween(l.expirationDate, now) : null,
        seatCount: l._count.seats,
        maintained: l.maintained,
      })),
      eolAssets: eolAssets.map((a) => ({
        id: a.id,
        assetTag: a.assetTag,
        name: a.name,
        assetEolDate: a.assetEolDate?.toISOString() ?? null,
        daysUntilEol: a.assetEolDate ? daysBetween(a.assetEolDate, now) : null,
        categoryName: a.category?.name ?? null,
        purchaseDate: a.purchaseDate?.toISOString() ?? null,
      })),
      maintenanceDue: maintenanceDue.slice(0, 20),
      summary: {
        expiringLicenseCount: expiringLicenses.length,
        eolAssetCount: eolAssets.length,
        maintenanceDueCount: maintenanceDue.length,
      },
    }

    return okResponse(data)
  } catch (e) {
    return errorResponse(e)
  }
}