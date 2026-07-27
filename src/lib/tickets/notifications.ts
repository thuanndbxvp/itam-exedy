/**
 * In-app notification helpers — Epic F.
 *
 * Tạo row HelpdeskNotification cho user nhận được event (ticket assigned,
 * comment mới, status đổi…). UI bell sẽ polling /api/notifications mỗi 30s.
 *
 * Sprint C9: cũng fanout tới external notification channels (Slack webhook).
 */
import type { HelpdeskNotificationKind } from "@prisma/client";
import prisma from "@/lib/prisma";
import { deliverExternalChannels } from "@/lib/notification-channel";

interface NotifyOpts {
  userId: string;
  ticketId?: string | null;
  kind: HelpdeskNotificationKind;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Tạo 1 notification row.
 * Idempotent: nếu cùng (userId, ticketId, kind, title) đã tồn tại trong 5 phút
 * gần nhất thì skip — tránh spam khi nhiều event cùng lúc.
 */
export async function notify(opts: NotifyOpts): Promise<void> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
  const dup = await prisma.helpdeskNotification.findFirst({
    where: {
      userId: opts.userId,
      ticketId: opts.ticketId ?? null,
      kind: opts.kind,
      title: opts.title,
      createdAt: { gte: fiveMinAgo },
    },
    select: { id: true },
  });
  if (dup) return;

  await prisma.helpdeskNotification.create({
    data: {
      userId: opts.userId,
      ticketId: opts.ticketId ?? null,
      kind: opts.kind,
      title: opts.title,
      body: opts.body,
      link: opts.link,
    },
  });

  // Sprint C9: fanout tới external channels (Slack) — best-effort, không await.
  void deliverExternalChannels({
    kind: opts.kind,
    title: opts.title,
    body: opts.body,
    link: opts.link,
  });
}

/**
 * Notify nhiều user cùng lúc (vd: cả team khi ticket mới được assign team).
 */
export async function notifyMany(userIds: string[], base: Omit<NotifyOpts, "userId">): Promise<void> {
  const unique = Array.from(new Set(userIds));
  await Promise.all(unique.map((userId) => notify({ ...base, userId })));
}
