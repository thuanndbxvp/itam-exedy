/**
 * Auto-generate ticket code — Epic F.
 *
 * Format: TKT-{YEAR}-{NNNN} (4 chữ số, zero-padded, đếm theo năm).
 *   2026-07-27 → ticket đầu tiên: TKT-2026-0001
 *
 * Cách làm: query max sequence trong năm hiện tại rồi +1.
 * Race condition: dùng transaction hoặc Prisma $transaction với serializable
 * để đảm bảo không trùng (xem cách dùng trong /api/tickets POST).
 */
import prisma from "@/lib/prisma";

/**
 * Sinh code mới cho năm hiện tại.
 * Caller phải wrap trong transaction hoặc catch unique constraint violation.
 */
export async function generateTicketCode(now: Date = new Date()): Promise<string> {
  const year = now.getFullYear();
  const prefix = `TKT-${year}-`;

  const latest = await prisma.ticket.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let next = 1;
  if (latest) {
    const tail = latest.code.slice(prefix.length);
    const n = parseInt(tail, 10);
    if (!Number.isNaN(n)) next = n + 1;
  }

  return `${prefix}${String(next).padStart(4, "0")}`;
}
