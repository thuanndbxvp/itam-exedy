/**
 * SLA computation — Epic F.
 *
 * Map priority → số giờ đến hạn. Hard-code 4 mức (không cho IT_MANAGER tùy chỉnh
 * ở MVP — Phase 2 sẽ expose qua /admin/helpdesk nếu cần).
 *
 *   URGENT : 4 giờ    (sự cố nghiêm trọng — server down, mất mạng toàn site…)
 *   HIGH   : 24 giờ   (ảnh hưởng công việc — laptop hỏng, mất license chính…)
 *   MEDIUM : 72 giờ   (3 ngày — máy chạy chậm, cần support thường)
 *   LOW    : 168 giờ  (7 ngày — yêu cầu cải tiến, FAQ)
 */
import type { TicketPriority } from "@prisma/client";

const SLA_HOURS: Record<TicketPriority, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

/**
 * Tính slaDueAt dựa trên priority và thời điểm tạo.
 * Default: createdAt = now (cho trường hợp tạo ticket mới).
 */
export function computeSlaDueAt(
  priority: TicketPriority,
  createdAt: Date = new Date()
): Date {
  const hours = SLA_HOURS[priority];
  const due = new Date(createdAt);
  due.setHours(due.getHours() + hours);
  return due;
}

/**
 * Trả về số phút còn lại đến deadline (âm nếu đã trễ).
 * Dùng cho UI badge "còn 2h" / "trễ 30 phút".
 */
export function minutesUntilSla(slaDueAt: Date | null): number | null {
  if (!slaDueAt) return null;
  const ms = slaDueAt.getTime() - Date.now();
  return Math.round(ms / 60_000);
}

export function isSlaOverdue(slaDueAt: Date | null): boolean {
  const m = minutesUntilSla(slaDueAt);
  return m !== null && m < 0;
}

/**
 * Format số phút thành chuỗi tiếng Việt ngắn.
 *   30 phút → "30 phút"
 *   90 phút → "1 giờ 30 phút"
 *   60 phút → "1 giờ"
 *   -90 phút → "trễ 1 giờ 30 phút"
 */
export function formatSlaCountdown(minutes: number): string {
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  let core: string;
  if (hours === 0) core = `${mins} phút`;
  else if (mins === 0) core = `${hours} giờ`;
  else core = `${hours} giờ ${mins} phút`;
  return minutes < 0 ? `trễ ${core}` : `còn ${core}`;
}
