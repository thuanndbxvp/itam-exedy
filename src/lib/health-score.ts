/**
 * Health Score Engine — Sprint C.11
 *
 * Tính điểm sức khỏe thiết bị (0-100):
 * - 100 = Thiết bị mới, chưa sửa chữa
 * - 0   = Thiết bị cần thay thế ngay
 *
 * Công thức kết hợp:
 *   1. Depreciation Factor (40 pts max) — Giá trị còn lại sau khấu hao
 *   2. Age Factor (30 pts max) — Tuổi thọ thiết bị
 *   3. Repair Factor (30 pts max) — Số lần sửa chữa
 *
 * Display: 100 - totalDeduction = Health Score
 */

import prisma from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

// Decimal fields from Prisma - use number after conversion
export interface HealthScoreInput {
  purchaseDate: Date | null;
  purchaseCost: number | string | null;
  expectedLifeMonths: number | null; // từ Depreciation config
  repairCount: number;
  totalRepairCost: number | string | null;
  assetModel?: {
    depreciation?: {
      months: number;
      depreciationType: 'LINEAR' | 'HALF_YEAR';
      minimumValue: number;
    } | null;
  } | null;
}

export interface HealthScoreResult {
  score: number; // 0-100 (100 = tốt nhất)
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  factors: {
    depreciation: { score: number; max: number; detail: string };
    age: { score: number; max: number; detail: string };
    repair: { score: number; max: number; detail: string };
  };
  recommendation: 'replace' | 'monitor' | 'continue';
  replaceReasons: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEPRECIATION_WEIGHT = 40;
const AGE_WEIGHT = 30;
const REPAIR_WEIGHT = 30;

const REPAIR_THRESHOLD = 3; // Ngưỡng số lần sửa chữa (configurable)

// ============================================================================
// CORE CALCULATION
// ============================================================================

/**
 * Tính Health Score từ raw data.
 * Pure function — không query DB.
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  let totalDeduction = 0;

  // -------------------------------------------------------------------------
  // 1. DEPRECIATION FACTOR (40 pts max)
  // Nếu giá trị còn lại = 0 → trừ nhiều nhất
  // -------------------------------------------------------------------------
  let depreciationFactor = 0;
  let depreciationDetail = 'Chưa khấu hao';

  if (input.purchaseDate && input.purchaseCost != null) {
    const purchaseValue = Number(input.purchaseCost);
    if (purchaseValue > 0) {
      const expectedMonths = input.expectedLifeMonths ?? input.assetModel?.depreciation?.months ?? 60;
      const depreciation = calculateDepreciation(
        input.purchaseDate,
        purchaseValue,
        expectedMonths,
        Number(input.assetModel?.depreciation?.minimumValue ?? 0),
        input.assetModel?.depreciation?.depreciationType ?? 'LINEAR'
      );
      const depreciationPercent = 1 - depreciation.remainingPercent;

      if (depreciationPercent >= 1) {
        depreciationFactor = DEPRECIATION_WEIGHT;
        depreciationDetail = `Khấu hao 100% (giá trị còn lại: 0)`;
      } else if (depreciationPercent >= 0.9) {
        depreciationFactor = 35;
        depreciationDetail = `Khấu hao > 90%`;
      } else if (depreciationPercent >= 0.8) {
        depreciationFactor = 28;
        depreciationDetail = `Khấu hao > 80%`;
      } else if (depreciationPercent >= 0.6) {
        depreciationFactor = 18;
        depreciationDetail = `Khấu hao > 60%`;
      } else if (depreciationPercent >= 0.4) {
        depreciationFactor = 10;
        depreciationDetail = `Khấu hao > 40%`;
      } else {
        depreciationDetail = `Khấu hao ${Math.round(depreciationPercent * 100)}%`;
      }
    }
  }
  totalDeduction += depreciationFactor;

  // -------------------------------------------------------------------------
  // 2. AGE FACTOR (30 pts max)
  // Dựa trên tuổi so với expected life
  // -------------------------------------------------------------------------
  let ageFactor = 0;
  let ageDetail = 'Mới';

  if (input.purchaseDate) {
    const expectedMonths = input.expectedLifeMonths ?? input.assetModel?.depreciation?.months ?? 60;
    const ageInMonths = calculateAgeInMonths(input.purchaseDate);
    const ageRatio = ageInMonths / expectedMonths;

    if (ageRatio >= 1.5) {
      ageFactor = AGE_WEIGHT;
      ageDetail = `Quá hạn > 50% (${ageInMonths} tháng / ${expectedMonths} tháng)`;
    } else if (ageRatio >= 1.2) {
      ageFactor = 25;
      ageDetail = `Quá hạn > 20% (${ageInMonths} tháng / ${expectedMonths} tháng)`;
    } else if (ageRatio >= 1.0) {
      ageFactor = 20;
      ageDetail = `Hết hạn (${ageInMonths} tháng / ${expectedMonths} tháng)`;
    } else if (ageRatio >= 0.8) {
      ageFactor = 12;
      ageDetail = `> 80% tuổi thọ (${ageInMonths} tháng)`;
    } else if (ageRatio >= 0.6) {
      ageFactor = 6;
      ageDetail = `> 60% tuổi thọ (${ageInMonths} tháng)`;
    } else if (ageRatio >= 0.4) {
      ageFactor = 3;
      ageDetail = `> 40% tuổi thọ (${ageInMonths} tháng)`;
    } else {
      ageDetail = `Tuổi: ${ageInMonths} tháng`;
    }
  }
  totalDeduction += ageFactor;

  // -------------------------------------------------------------------------
  // 3. REPAIR FACTOR (30 pts max)
  // Số lần sửa chữa + chi phí sửa chữa
  // -------------------------------------------------------------------------
  let repairFactor = 0;
  let repairDetail = 'Chưa sửa chữa';

  if (input.repairCount > 0) {
    if (input.repairCount >= REPAIR_THRESHOLD * 3) {
      repairFactor = 30;
      repairDetail = `Sửa chữa ${input.repairCount} lần (>= 3x ngưỡng)`;
    } else if (input.repairCount >= REPAIR_THRESHOLD * 2) {
      repairFactor = 22;
      repairDetail = `Sửa chữa ${input.repairCount} lần (>= 2x ngưỡng)`;
    } else if (input.repairCount >= REPAIR_THRESHOLD) {
      repairFactor = 15;
      repairDetail = `Sửa chữa ${input.repairCount} lần (>= ngưỡng ${REPAIR_THRESHOLD})`;
    } else {
      repairFactor = 5;
      repairDetail = `Sửa chữa ${input.repairCount} lần`;
    }
  }

  // Repair cost bonus (10 pts extra)
  const totalCost = Number(input.totalRepairCost ?? 0);
  const purchaseValue = Number(input.purchaseCost ?? 0);
  if (totalCost > 0 && purchaseValue > 0) {
    const costRatio = totalCost / purchaseValue;
    if (costRatio >= 0.5) {
      repairFactor += 10;
      repairDetail += `, chi phí >= 50% giá mua`;
    } else if (costRatio >= 0.3) {
      repairFactor += 7;
      repairDetail += `, chi phí >= 30% giá mua`;
    } else if (costRatio >= 0.1) {
      repairFactor += 3;
      repairDetail += `, chi phí >= 10% giá mua`;
    }
  }
  // Cap at 30
  repairFactor = Math.min(repairFactor, 30);
  totalDeduction += repairFactor;

  // -------------------------------------------------------------------------
  // FINAL SCORE
  // -------------------------------------------------------------------------
  const score = Math.max(0, Math.min(100, 100 - totalDeduction));

  // Grade
  let grade: HealthScoreResult['grade'];
  if (score >= 85) grade = 'excellent';
  else if (score >= 70) grade = 'good';
  else if (score >= 50) grade = 'fair';
  else grade = 'poor';

  // Recommendation
  const replaceReasons: string[] = [];
  if (depreciationFactor >= DEPRECIATION_WEIGHT) {
    replaceReasons.push('Thiết bị đã khấu hao 100%');
  }
  if (ageFactor >= AGE_WEIGHT) {
    replaceReasons.push('Thiết bị quá hạn sử dụng');
  }
  if (repairFactor >= 20) {
    replaceReasons.push(`Số lần sửa chữa cao (${input.repairCount} lần)`);
  }

  let recommendation: HealthScoreResult['recommendation'];
  if (score < 40 || replaceReasons.length >= 2) {
    recommendation = 'replace';
  } else if (score < 60) {
    recommendation = 'monitor';
  } else {
    recommendation = 'continue';
  }

  return {
    score,
    grade,
    factors: {
      depreciation: { score: depreciationFactor, max: DEPRECIATION_WEIGHT, detail: depreciationDetail },
      age: { score: ageFactor, max: AGE_WEIGHT, detail: ageDetail },
      repair: { score: repairFactor, max: 30, detail: repairDetail },
    },
    recommendation,
    replaceReasons,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Tính số tháng kể từ ngày mua.
 */
export function calculateAgeInMonths(purchaseDate: Date): number {
  const now = new Date();
  const months = (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
    (now.getMonth() - purchaseDate.getMonth());
  return Math.max(0, months);
}

/**
 * Tính khấu hao tài sản.
 * Trả về: remainingValue, remainingPercent, depreciatedAmount
 */
export function calculateDepreciation(
  purchaseDate: Date,
  purchaseValue: number,
  expectedLifeMonths: number,
  minimumValue: number,
  depreciationType: 'LINEAR' | 'HALF_YEAR' = 'LINEAR'
): { remainingValue: number; remainingPercent: number; depreciatedAmount: number } {
  const ageInMonths = calculateAgeInMonths(purchaseDate);

  if (ageInMonths <= 0) {
    return { remainingValue: purchaseValue, remainingPercent: 1, depreciatedAmount: 0 };
  }

  let annualDepreciation: number;

  if (depreciationType === 'HALF_YEAR') {
    // Half-year convention: Year 1 = 6 months depreciation, Year N = 6 months
    const fullYears = Math.floor(ageInMonths / 12);
    const remainingMonths = ageInMonths % 12;

    const yearlyDep = (purchaseValue - minimumValue) / expectedLifeMonths;
    const halfYearDep = yearlyDep / 2;

    let totalDepreciated = 0;
    for (let y = 0; y < fullYears; y++) {
      if (y === 0) {
        totalDepreciated += halfYearDep; // Year 1: 6 months
      } else if (y === fullYears - 1 && remainingMonths >= 6) {
        totalDepreciated += halfYearDep; // Last partial year if >= 6 months
      } else if (y < fullYears) {
        totalDepreciated += yearlyDep; // Full years in between
      }
    }

    annualDepreciation = totalDepreciated;
  } else {
    // Linear: đều mỗi tháng
    const totalDepreciable = purchaseValue - minimumValue;
    const monthsDepreciated = Math.min(ageInMonths, expectedLifeMonths);
    annualDepreciation = (totalDepreciable / expectedLifeMonths) * monthsDepreciated;
  }

  const depreciatedAmount = Math.min(annualDepreciation, purchaseValue - minimumValue);
  const remainingValue = Math.max(purchaseValue - depreciatedAmount, minimumValue);
  const remainingPercent = purchaseValue > 0 ? remainingValue / purchaseValue : 1;

  return { remainingValue, remainingPercent, depreciatedAmount };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Lấy Asset data cần thiết để tính Health Score.
 * Decimal fields returned as-is - convert in calculateHealthScore call.
 */
export async function getAssetForHealthScore(assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      purchaseDate: true,
      purchaseCost: true,
      repairCount: true,
      totalRepairCost: true,
      model: {
        select: {
          depreciation: {
            select: {
              months: true,
              depreciationType: true,
              minimumValue: true,
            },
          },
        },
      },
    },
  });
  
  if (!asset) return null;
  
  // Convert Decimal to number for type compatibility
  return {
    ...asset,
    purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null,
    totalRepairCost: asset.totalRepairCost ? Number(asset.totalRepairCost) : null,
    model: asset.model ? {
      ...asset.model,
      depreciation: asset.model.depreciation ? {
        ...asset.model.depreciation,
        minimumValue: Number(asset.model.depreciation.minimumValue),
      } : null,
    } : null,
  };
}

/**
 * Tính và cập nhật Health Score cho một asset.
 * Gọi sau khi tạo/cập nhật/xóa maintenance log.
 */
export async function recalculateHealthScore(assetId: string): Promise<HealthScoreResult | null> {
  const asset = await getAssetForHealthScore(assetId);
  if (!asset) return null;

  const result = calculateHealthScore({
    purchaseDate: asset.purchaseDate,
    purchaseCost: asset.purchaseCost,
    expectedLifeMonths: asset.model?.depreciation?.months ?? null,
    repairCount: asset.repairCount,
    totalRepairCost: asset.totalRepairCost,
    assetModel: asset.model,
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      healthScore: result.score,
      lastHealthCheck: new Date(),
    },
  });

  return result;
}

/**
 * Lấy Health Score summary cho dashboard.
 */
export async function getHealthScoreSummary(companyId?: string) {
  const where = companyId ? { companyId, deletedAt: null } : { deletedAt: null };

  const [excellent, good, fair, poor, total] = await Promise.all([
    prisma.asset.count({ where: { ...where, healthScore: { gte: 85 } } }),
    prisma.asset.count({ where: { ...where, healthScore: { gte: 70, lt: 85 } } }),
    prisma.asset.count({ where: { ...where, healthScore: { gte: 50, lt: 70 } } }),
    prisma.asset.count({ where: { ...where, healthScore: { lt: 50 } } }),
    prisma.asset.count({ where }),
  ]);

  // Assets cần thay thế (score < 50 hoặc chưa check)
  const needsReplacement = await prisma.asset.count({
    where: {
      ...where,
      OR: [
        { healthScore: { lt: 50 } },
        { healthScore: null },
      ],
    },
  });

  return {
    distribution: { excellent, good, fair, poor },
    total,
    needsReplacement,
  };
}

/**
 * Batch recalculate Health Score cho tất cả assets.
 * Chạy periodic (cron job) hoặc manual trigger.
 */
export async function batchRecalculateHealthScores(companyId?: string): Promise<number> {
  const where = companyId ? { companyId, deletedAt: null } : { deletedAt: null };

  // This function queries directly to avoid the conversion overhead in the loop
  const assets = await prisma.asset.findMany({
    where,
    select: {
      id: true,
      purchaseDate: true,
      purchaseCost: true,
      repairCount: true,
      totalRepairCost: true,
      model: {
        select: {
          depreciation: {
            select: {
              months: true,
              depreciationType: true,
              minimumValue: true,
            },
          },
        },
      },
    },
  });

  let updated = 0;
  for (const asset of assets) {
    const result = calculateHealthScore({
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null,
      expectedLifeMonths: asset.model?.depreciation?.months ?? null,
      repairCount: asset.repairCount,
      totalRepairCost: asset.totalRepairCost ? Number(asset.totalRepairCost) : null,
      assetModel: asset.model ? {
        ...asset.model,
        depreciation: asset.model.depreciation ? {
          ...asset.model.depreciation,
          minimumValue: Number(asset.model.depreciation.minimumValue)
        } : null
      } : null,
    });

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        healthScore: result.score,
        lastHealthCheck: new Date(),
      },
    });
    updated++;
  }

  return updated;
}
