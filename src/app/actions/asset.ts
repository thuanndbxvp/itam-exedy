'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActorUserId } from '@/lib/audit';
import prisma from '@/lib/prisma';
import { withRowLock } from '@/lib/locking';
import {
  checkoutAssetToUser,
  checkinAsset,
  checkoutAssetToLocation,
  checkoutAssetToAsset,
} from '@/lib/commands/asset';
import { DomainError } from '@/lib/errors';
import type { CommandResult } from '@/lib/errors';
import { runCommand } from '@/lib/commands/runCommand';
import { requirePermission } from '@/lib/permissions/guard';

/**
 * Create Asset (KHÔNG transactional lock — luôn là row mới, không xung đột).
 * Giữ signature cũ từ A2 để `/assets/new` form không cần sửa.
 */
export async function createAsset(data: {
  assetTag: string;
  name: string;
  serial?: string;
  modelId?: string;
  categoryId?: string;
  manufacturerId?: string;
  supplierId?: string;
  statusId: string;
  image?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  orderNumber?: string;
  warrantyMonths?: number;
  rtdLocationId?: string;
  depreciationId?: string;
  requestable?: boolean;
  byod?: boolean;
  notes?: string;
}): Promise<CommandResult<{ id: string; assetTag: string }>> {
  return runCommand(async () => {
    // RBAC: cần assets.create
    await requirePermission('assets.create');

    if (!data.assetTag?.trim() || !data.name?.trim() || !data.statusId) {
      throw new DomainError(
        'VALIDATION',
        'assetTag, name, statusId là bắt buộc.',
        { field: ['assetTag', 'name', 'statusId'] }
      );
    }

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    // B6: optional image cap 1MB (data-URI size) — refuse larger to protect DB.
    if (data.image && data.image.length > 1_500_000) {
      throw new DomainError(
        'VALIDATION',
        'Ảnh vượt quá 1.5MB sau khi encode base64. Vui lòng chọn ảnh nhỏ hơn.'
      );
    }

    const asset = await prisma.asset.create({
      data: {
        assetTag: data.assetTag.trim(),
        name: data.name.trim(),
        serial: data.serial?.trim() || null,
        modelId: data.modelId?.trim() || null,
        categoryId: data.categoryId?.trim() || null,
        manufacturerId: data.manufacturerId?.trim() || null,
        supplierId: data.supplierId?.trim() || null,
        statusId: data.statusId,
        image: data.image?.trim() || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
        orderNumber: data.orderNumber?.trim() || null,
        warrantyMonths: data.warrantyMonths ?? null,
        rtdLocationId: data.rtdLocationId?.trim() || null,
        depreciationId: data.depreciationId?.trim() || null,
        requestable: data.requestable ?? true,
        byod: data.byod ?? false,
        notes: data.notes?.trim() || null,
      },
    });

    await prisma.actionLog.create({
      data: {
        actionType: 'CREATE',
        itemId: asset.id,
        itemType: 'ASSET',
        userId: actorId,
        notes: `Tạo mới tài sản "${asset.assetTag}"`,
      },
    });

    revalidatePath('/assets');
    return { id: asset.id, assetTag: asset.assetTag };
  }, 'createAsset');
}

/**
 * Update Asset — yêu cầu assets.update permission.
 */
export async function updateAsset(data: {
  id: string;
  assetTag: string;
  name: string;
  serial?: string;
  modelId?: string;
  categoryId?: string;
  manufacturerId?: string;
  supplierId?: string;
  statusId: string;
  image?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  orderNumber?: string;
  warrantyMonths?: number;
  rtdLocationId?: string;
  depreciationId?: string;
  requestable?: boolean;
  byod?: boolean;
  notes?: string;
}): Promise<CommandResult<{ id: string; assetTag: string }>> {
  return runCommand(async () => {
    // RBAC: cần assets.update
    await requirePermission('assets.update');

    if (!data.assetTag?.trim() || !data.name?.trim() || !data.statusId) {
      throw new DomainError('VALIDATION', 'assetTag, name, statusId là bắt buộc.');
    }

    if (data.image && data.image.length > 1_500_000) {
      throw new DomainError(
        'VALIDATION',
        'Ảnh vượt quá 1.5MB sau khi encode base64. Vui lòng chọn ảnh nhỏ hơn.'
      );
    }

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const asset = await prisma.asset.update({
      where: { id: data.id },
      data: {
        assetTag: data.assetTag.trim(),
        name: data.name.trim(),
        serial: data.serial?.trim() || null,
        modelId: data.modelId?.trim() || null,
        categoryId: data.categoryId?.trim() || null,
        manufacturerId: data.manufacturerId?.trim() || null,
        supplierId: data.supplierId?.trim() || null,
        statusId: data.statusId,
        image: data.image !== undefined ? (data.image?.trim() || null) : undefined,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
        orderNumber: data.orderNumber?.trim() || null,
        warrantyMonths: data.warrantyMonths ?? null,
        rtdLocationId: data.rtdLocationId?.trim() || null,
        depreciationId: data.depreciationId?.trim() || null,
        requestable: data.requestable ?? true,
        byod: data.byod ?? false,
        notes: data.notes?.trim() || null,
      },
    });

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemId: asset.id,
        itemType: 'ASSET',
        userId: actorId,
        notes: `Cập nhật tài sản "${asset.assetTag}"`,
      },
    });

    revalidatePath('/assets');
    revalidatePath(`/assets/${asset.id}`);
    return { id: asset.id, assetTag: asset.assetTag };
  }, 'updateAsset');
}

/**
 * Server action wrapper cho `checkoutAssetToUser`.
 *
 * Pattern: wrapper mở row-lock + transaction, command thuần xử lý business logic.
 * Catch DomainError → trả về discriminated union để client component dùng (Epic D sẽ render toast).
 */
export async function checkoutAssetCmd(params: {
  assetId: string;
  targetUserId: string;
  notes?: string;
  expectedCheckin?: string; // ISO string từ form; convert sang Date
}): Promise<CommandResult<{ id: string; assetTag: string }>> {
  return runCommand(async () => {
    // RBAC: cần assets.checkout
    await requirePermission('assets.checkout');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkoutAssetToUser(tx, {
        assetId: params.assetId,
        targetUserId: params.targetUserId,
        actorId,
        notes: params.notes,
        expectedCheckin: params.expectedCheckin
          ? new Date(params.expectedCheckin)
          : null,
      })
    );

    revalidatePath('/assets');
    return { id: result.id, assetTag: result.assetTag };
  }, 'checkoutAssetCmd');
}

export async function checkinAssetCmd(params: {
  assetId: string;
  notes?: string;
}): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    // RBAC: cần assets.checkin
    await requirePermission('assets.checkin');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkinAsset(tx, {
        assetId: params.assetId,
        actorId,
        notes: params.notes,
      })
    );

    revalidatePath('/assets');
    return { id: result.id };
  }, 'checkinAssetCmd');
}

export async function checkoutAssetToLocationCmd(params: {
  assetId: string;
  targetLocationId: string;
  notes?: string;
}): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    // RBAC: cần assets.checkout (gán cho location cũng là dạng checkout)
    await requirePermission('assets.checkout');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkoutAssetToLocation(tx, {
        assetId: params.assetId,
        targetLocationId: params.targetLocationId,
        actorId,
        notes: params.notes,
      })
    );

    revalidatePath('/assets');
    return { id: result.id };
  }, 'checkoutAssetToLocationCmd');
}

/**
 * B7 — Checkout Asset cho Asset khác (vd: chuột gán cho laptop).
 */
export async function checkoutAssetToAssetCmd(params: {
  assetId: string;
  targetAssetId: string;
  notes?: string;
  expectedCheckin?: string;
}): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    // RBAC: cần assets.checkout
    await requirePermission('assets.checkout');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkoutAssetToAsset(tx, {
        assetId: params.assetId,
        targetAssetId: params.targetAssetId,
        actorId,
        notes: params.notes,
        expectedCheckin: params.expectedCheckin
          ? new Date(params.expectedCheckin)
          : null,
      })
    );

    revalidatePath('/assets');
    return { id: result.id };
  }, 'checkoutAssetToAssetCmd');
}
