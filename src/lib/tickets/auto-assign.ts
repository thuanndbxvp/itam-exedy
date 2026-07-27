/**
 * Auto-assign rule resolver — Epic F.
 *
 * Khi ticket được tạo, chạy rule engine để tự động:
 *   1. Set teamId (vd: HARDWARE → Helpdesk-L1, NETWORK → Network team)
 *   2. Optional: set assigneeId cụ thể nếu rule có assignToUserId
 *
 * Rule có cấu trúc:
 *   - match: category (required), priority (optional), type (optional)
 *   - target: teamId (optional), assignToUserId (optional)
 *   - weight: cao hơn = thắng khi nhiều rule match
 *
 * Chỉ rule `isActive=true` mới chạy.
 */
import type { TicketCategory, TicketPriority, TicketType } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface AutoAssignResult {
  teamId: string | null;
  assigneeId: string | null;
}

/**
 * Resolve rule đầu tiên match (weight DESC).
 *
 * Logic match:
 *   - category: BẮT BUỘC khớp
 *   - priority: optional — nếu rule có priority thì phải khớp, nếu null thì match mọi priority
 *   - type: optional — tương tự priority
 *
 * Trả về rule có weight cao nhất trong các rule match.
 */
export async function resolveAssignmentRule(input: {
  category: TicketCategory;
  priority: TicketPriority;
  type: TicketType;
}): Promise<AutoAssignResult> {
  const rules = await prisma.helpdeskAssignmentRule.findMany({
    where: {
      isActive: true,
      category: input.category,
      AND: [
        {
          OR: [{ priority: input.priority }, { priority: null }],
        },
        {
          OR: [{ type: input.type }, { type: null }],
        },
      ],
    },
    orderBy: { weight: "desc" },
  });

  const chosen = rules[0];
  if (!chosen) {
    return { teamId: null, assigneeId: null };
  }

  return {
    teamId: chosen.teamId ?? null,
    assigneeId: chosen.assignToUserId ?? null,
  };
}
