/**
 * Notification delivery helper — Sprint C9.
 *
 * Sau khi ghi notification (in-app) → forward tới external channels (Slack webhook).
 * Không block caller — best-effort delivery.
 */
import prisma from '@/lib/prisma'
import type { HelpdeskNotificationKind } from '@prisma/client'

interface DeliverableNotification {
  kind: HelpdeskNotificationKind | string
  title: string
  body?: string | null | undefined
  link?: string | null | undefined
}

function formatSlackMessage(n: DeliverableNotification): {
  text: string
  blocks: unknown[]
} {
  return {
    text: n.title,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${n.title}*` },
      },
      ...(n.body
        ? [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: n.body },
            },
          ]
        : []),
      ...(n.link
        ? [
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Mở' },
                  url: n.link,
                },
              ],
            },
          ]
        : []),
    ],
  }
}

export async function deliverExternalChannels(n: DeliverableNotification) {
  try {
    const channels = await prisma.notificationChannel.findMany({
      where: { enabled: true, deletedAt: null, kind: 'SLACK' },
      select: {
        id: true,
        url: true,
        filterKinds: true,
      },
    })

    for (const channel of channels) {
      // Optional filterKinds — empty = forward all
      const filterKinds = Array.isArray(channel.filterKinds)
        ? (channel.filterKinds as unknown[]).filter((k): k is string => typeof k === 'string')
        : []
      if (filterKinds.length > 0 && !filterKinds.includes(String(n.kind))) {
        continue
      }

      // POST async + update lastDelivery timestamp
      const message = formatSlackMessage(n)

      fetch(channel.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(message),
      })
        .then(async (res) => {
          const ok = res.ok
          await prisma.notificationChannel.update({
            where: { id: channel.id },
            data: {
              lastDeliveryAt: new Date(),
              lastDeliveryError: ok ? null : `HTTP ${res.status}`,
            },
          })
        })
        .catch(async (e) => {
          await prisma.notificationChannel.update({
            where: { id: channel.id },
            data: {
              lastDeliveryAt: new Date(),
              lastDeliveryError: (e as Error).message ?? 'Unknown error',
            },
          })
        })
    }
  } catch (e) {
    console.warn('[notification-channel] fanout failed:', (e as Error).message)
  }
}

/**
 * Test ping — gửi 1 message test đến 1 channel.
 */
export async function testSlackChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  const channel = await prisma.notificationChannel.findUnique({ where: { id: channelId } })
  if (!channel) return { ok: false, error: 'Channel không tồn tại.' }
  if (channel.kind !== 'SLACK') return { ok: false, error: 'Channel không phải Slack.' }

  const message = {
    text: 'Test ping từ IT Asset Management',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:white_check_mark: *IT Asset — Slack integration OK*\nKết nối thành công lúc ${new Date().toLocaleString('vi-VN')}.`,
        },
      },
    ],
  }

  try {
    const res = await fetch(channel.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message),
    })
    if (!res.ok) {
      const errMsg = `HTTP ${res.status}`
      await prisma.notificationChannel.update({
        where: { id: channel.id },
        data: { lastDeliveryAt: new Date(), lastDeliveryError: errMsg },
      })
      return { ok: false, error: errMsg }
    }
    await prisma.notificationChannel.update({
      where: { id: channel.id },
      data: { lastDeliveryAt: new Date(), lastDeliveryError: null },
    })
    return { ok: true }
  } catch (e) {
    const err = (e as Error).message ?? 'Unknown error'
    await prisma.notificationChannel.update({
      where: { id: channel.id },
      data: { lastDeliveryAt: new Date(), lastDeliveryError: err },
    })
    return { ok: false, error: err }
  }
}
