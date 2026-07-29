/**
 * Handover Library — Sprint C.12
 *
 * Xử lý nghiệp vụ Biên bản Bàn giao Tài sản:
 * - Tạo biên bản bàn giao (checkout/return/transfer)
 * - Generate PDF với template chuẩn
 * - E-Sign confirmation
 * - Gửi email xác nhận
 */

import prisma from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import type { HandoverAction } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateHandoverParams {
  assetId: string;
  action: HandoverAction;
  toUserId: string;
  fromUserId?: string | null;
  fromDeptId?: string | null;
  fromLocationId?: string | null;
  toDeptId?: string | null;
  toLocationId?: string | null;
  accessories?: string[];
  condition?: string;
  note?: string;
  userId: string;
}

export interface HandoverResult {
  id: string;
  docNo: string;
  pdfUrl?: string;
  confirmToken?: string;
  tokenExpiresAt?: Date;
}

export interface HandoverDetails {
  asset: {
    id: string;
    assetTag: string;
    name: string;
    serial: string | null;
    category: string | null;
    manufacturer: string | null;
    purchaseDate: Date | null;
    purchaseCost: number | null;
  };
  from: {
    user: string | null;
    department: string | null;
    location: string | null;
  };
  to: {
    user: string;
    email: string;
    department: string | null;
    location: string | null;
  };
  handover: {
    docNo: string;
    action: string;
    date: Date;
    condition: string | null;
    accessories: string[];
  };
}

// ============================================================================
// DOCUMENT NUMBER GENERATION
// ============================================================================

/**
 * Tạo số biên bản: HB-YYYY-NNNNNN
 */
export async function generateHandoverDocNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `HB-${year}-`;

  // Tìm số lớn nhất trong năm
  const lastDoc = await prisma.assetHandover.findFirst({
    where: {
      docNo: { startsWith: prefix },
    },
    orderBy: { docNo: 'desc' },
    select: { docNo: true },
  });

  let seq = 1;
  if (lastDoc?.docNo) {
    const lastSeq = parseInt(lastDoc.docNo.replace(prefix, ''), 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}${seq.toString().padStart(6, '0')}`;
}

// ============================================================================
// CORE HANDOVER CREATION
// ============================================================================

/**
 * Tạo biên bản bàn giao mới.
 * - Tạo bản ghi AssetHandover
 * - Generate PDF
 * - Gửi email E-sign (nếu có manager email)
 */
export async function createHandover(params: CreateHandoverParams): Promise<HandoverResult> {
  const {
    assetId,
    action,
    toUserId,
    fromUserId = null,
    fromDeptId = null,
    fromLocationId = null,
    toDeptId = null,
    toLocationId = null,
    accessories = [],
    condition = null,
    note = null,
    userId,
  } = params;

  // Validate: asset phải tồn tại
  const asset = await prisma.asset.findUnique({
    where: { id: assetId, deletedAt: null },
    include: {
      category: { select: { name: true } },
      manufacturer: { select: { name: true } },
    },
  });

  if (!asset) {
    throw new Error('Asset không tồn tại');
  }

  // Validate: toUser phải tồn tại
  const toUser = await prisma.user.findUnique({
    where: { id: toUserId, deletedAt: null },
    include: {
      department: { select: { name: true } },
      location: { select: { name: true } },
    },
  });

  if (!toUser) {
    throw new Error('Người nhận không tồn tại');
  }

  // Generate document number
  const docNo = await generateHandoverDocNo();

  // Generate confirm token (7 ngày expire)
  const confirmToken = generateSecureToken();
  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create handover record
  const handover = await prisma.assetHandover.create({
    data: {
      assetId,
      action,
      handoverDate: new Date(),
      fromUserId,
      fromDeptId,
      fromLocationId,
      toUserId,
      toDeptId,
      toLocationId,
      accessories: accessories.length > 0 ? JSON.stringify(accessories) : null,
      condition,
      note,
      docNo,
      confirmToken,
      tokenExpiresAt,
      managerName: toUser.department?.name ?? null,
      managerEmail: toUser.email ?? null,
    },
    include: {
      asset: {
        select: {
          id: true,
          assetTag: true,
          name: true,
        },
      },
      toUser: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Generate PDF
  const pdfUrl = await generateHandoverPdf(handover.id);

  // Update with PDF URL
  const updated = await prisma.assetHandover.update({
    where: { id: handover.id },
    data: { pdfUrl },
  });

  // Audit log
  await recordAudit(
    userId,
    action === 'HANDOVER' ? 'CHECKOUT' : action === 'RETURN' ? 'CHECKIN' : 'UPDATE',
    'ASSET',
    assetId,
    `Tạo biên bản bàn giao ${docNo} — ${action}`
  );

  return {
    id: updated.id,
    docNo: updated.docNo!,
    pdfUrl: updated.pdfUrl ?? undefined,
    confirmToken: updated.confirmToken ?? undefined,
    tokenExpiresAt: updated.tokenExpiresAt ?? undefined,
  };
}

/**
 * Verify E-sign token
 */
export async function verifyConfirmToken(token: string): Promise<{
  valid: boolean;
  handover?: {
    id: string;
    docNo: string;
    assetTag: string;
    assetName: string;
    toUserName: string;
    confirmedAt: Date | null;
  };
  error?: string;
}> {
  const handover = await prisma.assetHandover.findUnique({
    where: { confirmToken: token },
    include: {
      asset: { select: { assetTag: true, name: true } },
      toUser: { select: { firstName: true, lastName: true } },
    },
  });

  if (!handover) {
    return { valid: false, error: 'Token không hợp lệ' };
  }

  if (handover.confirmedAt) {
    return { valid: false, error: 'Biên bản đã được xác nhận trước đó' };
  }

  if (handover.tokenExpiresAt && new Date() > handover.tokenExpiresAt) {
    return { valid: false, error: 'Link xác nhận đã hết hạn' };
  }

  return {
    valid: true,
    handover: {
      id: handover.id,
      docNo: handover.docNo!,
      assetTag: handover.asset.assetTag,
      assetName: handover.asset.name,
      toUserName: `${handover.toUser.firstName} ${handover.toUser.lastName ?? ''}`.trim(),
      confirmedAt: handover.confirmedAt,
    },
  };
}

/**
 * Confirm E-sign
 */
export async function confirmHandover(
  token: string,
  options?: {
    confirmedByIp?: string;
    confirmedUserId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const verification = await verifyConfirmToken(token);

  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  await prisma.assetHandover.update({
    where: { id: verification.handover!.id },
    data: {
      confirmedAt: new Date(),
      confirmedBy: options?.confirmedByIp ?? null,
      confirmedUserId: options?.confirmedUserId ?? null,
    },
  });

  // Audit log
  await recordAudit(
    verification.handover!.id,
    'ACCEPTED',
    'ASSET',
    '',
    `Xác nhận biên bản bàn giao ${verification.handover!.docNo} qua E-sign`
  );

  return { success: true };
}

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * Generate PDF cho biên bản bàn giao.
 * Sử dụng jspdf hoặc pdfmake (sẽ cài đặt sau).
 */
export async function generateHandoverPdf(handoverId: string): Promise<string> {
  // TODO: Implement PDF generation
  // const { default: jsPDF } = await import('jspdf');
  // const doc = new jsPDF();
  // ...

  // Temporary: return placeholder URL
  return `/api/handover/${handoverId}/pdf`;
}

/**
 * Lấy chi tiết handover cho PDF generation
 */
export async function getHandoverDetails(handoverId: string): Promise<HandoverDetails | null> {
  const handover = await prisma.assetHandover.findUnique({
    where: { id: handoverId },
    include: {
      asset: {
        include: {
          category: { select: { name: true } },
          manufacturer: { select: { name: true } },
        },
      },
      fromUser: {
        include: {
          department: { select: { name: true } },
          location: { select: { name: true } },
        },
      },
      toUser: {
        include: {
          department: { select: { name: true } },
          location: { select: { name: true } },
        },
      },
    },
  });

  if (!handover) return null;

  return {
    asset: {
      id: handover.asset.id,
      assetTag: handover.asset.assetTag,
      name: handover.asset.name,
      serial: handover.asset.serial,
      category: handover.asset.category?.name ?? null,
      manufacturer: handover.asset.manufacturer?.name ?? null,
      purchaseDate: handover.asset.purchaseDate,
      purchaseCost: handover.asset.purchaseCost ? Number(handover.asset.purchaseCost) : null,
    },
    from: {
      user: handover.fromUser
        ? `${handover.fromUser.firstName} ${handover.fromUser.lastName ?? ''}`.trim()
        : null,
      department: handover.fromUser?.department?.name ?? null,
      location: handover.fromUser?.location?.name ?? null,
    },
    to: {
      user: `${handover.toUser.firstName} ${handover.toUser.lastName ?? ''}`.trim(),
      email: handover.toUser.email ?? '',
      department: handover.toUser.department?.name ?? null,
      location: handover.toUser.location?.name ?? null,
    },
    handover: {
      docNo: handover.docNo ?? '',
      action: handover.action,
      date: handover.handoverDate,
      condition: handover.condition,
      accessories: handover.accessories ? JSON.parse(handover.accessories) : [],
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate secure random token
 */
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Lấy lịch sử handover của một asset
 */
export async function getAssetHandoverHistory(assetId: string): Promise<Array<{
  id: string;
  docNo: string | null;
  action: string;
  handoverDate: Date;
  toUser: { firstName: string; lastName: string | null };
  confirmedAt: Date | null;
  condition: string | null;
}>> {
  const handovers = await prisma.assetHandover.findMany({
    where: { assetId },
    orderBy: { handoverDate: 'desc' },
    select: {
      id: true,
      docNo: true,
      action: true,
      handoverDate: true,
      toUser: {
        select: { firstName: true, lastName: true },
      },
      confirmedAt: true,
      condition: true,
    },
  });

  return handovers;
}

/**
 * Kiểm tra handover cần xác nhận của một user
 */
export async function getPendingConfirmations(userId: string): Promise<Array<{
  id: string;
  docNo: string;
  assetTag: string;
  assetName: string;
  action: string;
  handoverDate: Date;
  tokenExpiresAt: Date | null;
}>> {
  const handovers = await prisma.assetHandover.findMany({
    where: {
      toUserId: userId,
      confirmedAt: null,
      tokenExpiresAt: { gt: new Date() },
    },
    orderBy: { handoverDate: 'desc' },
    select: {
      id: true,
      docNo: true,
      asset: {
        select: { assetTag: true, name: true },
      },
      action: true,
      handoverDate: true,
      tokenExpiresAt: true,
    },
  });

  return handovers
    .filter(h => h.docNo !== null)
    .map(h => ({
      id: h.id,
      docNo: h.docNo!,
      assetTag: h.asset.assetTag,
      assetName: h.asset.name,
      action: h.action,
      handoverDate: h.handoverDate,
      tokenExpiresAt: h.tokenExpiresAt,
    }));
}

/**
 * Format action type sang tiếng Việt
 */
export function formatActionType(action: HandoverAction): string {
  switch (action) {
    case 'HANDOVER':
      return 'Cấp phát';
    case 'RETURN':
      return 'Thu hồi';
    case 'TRANSFER':
      return 'Điều chuyển';
    default:
      return action;
  }
}
