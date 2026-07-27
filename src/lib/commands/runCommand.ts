import { DomainError, type CommandResult } from '@/lib/errors'

/**
 * Helper wrap try/catch dùng chung cho toàn bộ server-action command wrappers.
 *
 * Convert DomainError (NotFoundError, InvalidStateError, ForbiddenError, ValidationError,
 * ConflictError, LockedError) → `CommandResult<T>` failure với `code + message`.
 * Các lỗi khác → log + UNKNOWN.
 *
 * Lý do tách shared (Phase 4 — DRY Sprint):
 *  - Trước đó mỗi file `actions/*.ts` định nghĩa bản copy riêng (~20 LOC × N files).
 *  - Dễ drift khi 1 chỗ sửa (vd: bổ sung logger, thêm metadata) mà quýt các chỗ khác.
 *
 * Contract (KHÔNG đổi):
 *  - Input: `fn: () => Promise<T>`, `contextLabel: string` (chỉ cho log).
 *  - Output: `Promise<CommandResult<T>>` — discriminated union ok=true | ok=false.
 *  - Mọi server action cũ gọi `runCommand(async () => ...)` sẽ nhận đúng cùng kết quả.
 *
 * Ví dụ:
 *   export async function checkoutAssetCmd(params) {
 *     return runCommand(async () => {
 *       await requirePermission('assets.checkout')
 *       ...
 *       return { id: asset.id, assetTag: asset.assetTag }
 *     }, 'checkoutAssetCmd')
 *   }
 */
export function runCommand<T>(
  fn: () => Promise<T>,
  contextLabel: string
): Promise<CommandResult<T>> {
  return fn()
    .then((data) => Promise.resolve({ ok: true as const, data }))
    .catch((e: unknown) => {
      if (e instanceof DomainError) {
        return Promise.resolve({ ok: false as const, code: e.code, message: e.message })
      }
      console.error(`[${contextLabel}] UNKNOWN ERROR`, e)
      return Promise.resolve({
        ok: false as const,
        code: 'UNKNOWN',
        message: 'Lỗi hệ thống không xác định. Vui lòng thử lại.',
      })
    })
}