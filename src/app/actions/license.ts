'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActorUserId } from '@/lib/audit';
import prisma from '@/lib/prisma';
import { withRowLock } from '@/lib/locking';
import {
  checkoutLicenseSeat,
  checkinLicenseSeat,
  expireLicenseSeat,
  createLicenseWithSeats,
} from '@/lib/commands/license';
import type { CommandResult } from '@/lib/errors';
import { runCommand } from '@/lib/commands/runCommand';
import { requirePermission } from '@/lib/permissions/guard';

/**
 * Create License + nested N seats — wrap `createLicenseWithSeats` (pure command).
 *
 * Giữ signature cũ `{ name, productKey, seatsTotal }` để `/licenses/new`
 * form không cần sửa.
 */
export async function createLicense(data: {
  name: string;
  productKey?: string;
  serial?: string;
  categoryId?: string;
  manufacturerId?: string;
  supplierId?: string;
  companyId?: string;
  seatsTotal: number;
  expirationDate?: string;
  terminationDate?: string;
  reassignable?: boolean;
  maintained?: boolean;
  purchaseDate?: string;
  purchaseCost?: number;
  purchaseOrder?: string;
  orderNumber?: string;
  notes?: string;
  licenseEmail?: string;
  licenseName?: string;
  minAmt?: number;
}): Promise<CommandResult<{ id: string; name: string; seatsCount: number }>> {
  return runCommand(async () => {
    // RBAC: cần licenses.create
    await requirePermission('licenses.create');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const license = await prisma.$transaction((tx) =>
      createLicenseWithSeats(tx, {
        name: data.name,
        productKey: data.productKey ?? null,
        seatCount: data.seatsTotal,
        actorId,
      })
    );

    // Update additional fields after creation
    await prisma.license.update({
      where: { id: license.id },
      data: {
        serial: data.serial?.trim() || null,
        categoryId: data.categoryId?.trim() || null,
        manufacturerId: data.manufacturerId?.trim() || null,
        supplierId: data.supplierId?.trim() || null,
        companyId: data.companyId?.trim() || null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
        reassignable: data.reassignable ?? true,
        maintained: data.maintained ?? true,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
        purchaseOrder: data.purchaseOrder?.trim() || null,
        orderNumber: data.orderNumber?.trim() || null,
        notes: data.notes?.trim() || null,
        licenseEmail: data.licenseEmail?.trim() || null,
        licenseName: data.licenseName?.trim() || null,
        minAmt: data.minAmt ?? null,
      },
    });

    revalidatePath('/licenses');
    return {
      id: license.id,
      name: license.name,
      seatsCount: license.seats.length,
    };
  }, 'createLicense');
}

/**
 * Update License — ADMIN only.
 */
export async function updateLicense(data: {
  id: string;
  name: string;
  productKey?: string;
  serial?: string;
  categoryId?: string;
  manufacturerId?: string;
  supplierId?: string;
  companyId?: string;
  expirationDate?: string;
  terminationDate?: string;
  reassignable?: boolean;
  maintained?: boolean;
  purchaseDate?: string;
  purchaseCost?: number;
  purchaseOrder?: string;
  orderNumber?: string;
  notes?: string;
  licenseEmail?: string;
  licenseName?: string;
  minAmt?: number;
}): Promise<CommandResult<{ id: string; name: string }>> {
  return runCommand(async () => {
    // RBAC: cần licenses.update
    await requirePermission('licenses.update');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const license = await prisma.license.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        productKey: data.productKey?.trim() || null,
        serial: data.serial?.trim() || null,
        categoryId: data.categoryId?.trim() || null,
        manufacturerId: data.manufacturerId?.trim() || null,
        supplierId: data.supplierId?.trim() || null,
        companyId: data.companyId?.trim() || null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
        reassignable: data.reassignable ?? true,
        maintained: data.maintained ?? true,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
        purchaseOrder: data.purchaseOrder?.trim() || null,
        orderNumber: data.orderNumber?.trim() || null,
        notes: data.notes?.trim() || null,
        licenseEmail: data.licenseEmail?.trim() || null,
        licenseName: data.licenseName?.trim() || null,
        minAmt: data.minAmt ?? null,
      },
    });

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemType: 'LICENSE',
        itemId: license.id,
        userId: actorId,
        notes: `Cập nhật license "${license.name}"`,
      },
    });

    revalidatePath('/licenses');
    revalidatePath(`/licenses/${license.id}`);
    return { id: license.id, name: license.name };
  }, 'updateLicense');
}

/**
 * Checkout 1 LicenseSeat cho User — transactional với row-lock trên seat.
 * Đổi tên từ `assignLicenseSeatCmd` để thống nhất verb "checkout/checkin" với asset commands.
 */
export async function checkoutLicenseSeatCmd(params: {
  seatId: string;
  targetUserId?: string;
  targetAssetId?: string;
  notes?: string;
}): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    // RBAC: cần licenses.assign
    await requirePermission('licenses.assign');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('LicenseSeat', params.seatId, (tx) =>
      checkoutLicenseSeat(tx, {
        seatId: params.seatId,
        targetUserId: params.targetUserId,
        targetAssetId: params.targetAssetId,
        actorId,
        notes: params.notes,
      })
    );

    revalidatePath('/licenses');
    return { id: result.id };
  }, 'checkoutLicenseSeatCmd');
}

/**
 * Checkin 1 LicenseSeat — transactional với row-lock trên seat.
 * Đổi tên từ `revokeLicenseSeatCmd` để thống nhất verb "checkout/checkin" với asset commands.
 */
export async function checkinLicenseSeatCmd(params: {
  seatId: string;
  notes?: string;
}): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    // RBAC: cần licenses.assign
    await requirePermission('licenses.assign');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('LicenseSeat', params.seatId, (tx) =>
      checkinLicenseSeat(tx, {
        seatId: params.seatId,
        actorId,
        notes: params.notes,
      })
    );

    revalidatePath('/licenses');
    return { id: result.id };
  }, 'checkinLicenseSeatCmd');
}

/**
 * Expire 1 LicenseSeat — đánh dấu unreassignable + log audit.
 */
export async function expireLicenseSeatCmd(params: {
  seatId: string;
  reason?: string;
}): Promise<CommandResult<{ id: string; unreassignableSeat: boolean }>> {
  return runCommand(async () => {
    // RBAC: cần licenses.assign
    await requirePermission('licenses.assign');

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('LicenseSeat', params.seatId, (tx) =>
      expireLicenseSeat(tx, {
        seatId: params.seatId,
        actorId,
        reason: params.reason,
      })
    );

    revalidatePath('/licenses');
    return { id: result.id, unreassignableSeat: result.unreassignableSeat };
  }, 'expireLicenseSeatCmd');
}
