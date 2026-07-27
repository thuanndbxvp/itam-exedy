/**
 * Custom error classes cho Domain Commands (Epic B).
 *
 * Mọi command PHẢI throw 1 trong các error class dưới đây khi nghiệp vụ fail.
 * Server-action wrapper (`src/app/actions/*.ts`) sẽ catch và convert thành
 * discriminated-union `CommandResult<T>` cho client component.
 *
 * Phase 1: giữ 1 file nhỏ, KHÔNG dùng thư viện ngoài (errors, http-errors).
 * Phase 2 (nếu cần REST API cho mobile) sẽ map sang HTTP status code ở wrapper.
 */

export class DomainError extends Error {
  readonly code: string;
  readonly meta?: Record<string, unknown>;

  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.meta = meta;
  }
}

/**
 * Thực thể (entity) không tồn tại trong DB.
 * Ví dụ: assetId truyền vào không có → throw NotFoundError('Asset', assetId).
 */
export class NotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super('NOT_FOUND', `${entityName} với id "${id}" không tồn tại`, { entityName, id });
    this.name = 'NotFoundError';
  }
}

/**
 * Trạng thái nghiệp vụ không hợp lệ.
 * Ví dụ: asset không deployable / asset đang được gán cho target khác /
 *        user chưa activate / seat đã được gán cho người khác.
 */
export class InvalidStateError extends DomainError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super('INVALID_STATE', message, meta);
    this.name = 'InvalidStateError';
  }
}

/**
 * Xung đột tài nguyên — khi không acquire được lock hoặc race-condition khác.
 * Ví dụ: 2 admin cùng checkout 1 asset → admin thứ 2 throw LockedError.
 */
export class ConflictError extends DomainError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super('CONFLICT', message, meta);
    this.name = 'ConflictError';
  }
}

/**
 * Specific lock-related error — khi 2 admin cùng thao tác trên 1 row.
 * `code = 'LOCKED'` để UI có thể render message khác (vd: "Hệ thống đang bận, thử lại sau").
 */
export class LockedError extends DomainError {
  constructor(resource: string, id: string) {
    super(
      'LOCKED',
      `Không thể khóa ${resource} "${id}" — đang có thao tác khác. Vui lòng thử lại sau vài giây.`,
      { resource, id }
    );
    this.name = 'LockedError';
  }
}

/**
 * Validation đầu vào từ form / API sai format.
 * Ví dụ: missing required field, sai enum, string rỗng khi bắt buộc.
 */
export class ValidationError extends DomainError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super('VALIDATION', message, meta);
    this.name = 'ValidationError';
  }
}

/**
 * User không có quyền thực hiện action (RBAC).
 * Example: EMPLOYEE cố gọi `checkoutAssetCmd` → throw ForbiddenError.
 *
 * Phase 1: chỉ dùng cho role check (ADMIN-only actions).
 * Phase 2: mở rộng cho resource-level permissions (vd: user chỉ checkin được asset CỦA MÌNH).
 */
export class ForbiddenError extends DomainError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super('FORBIDDEN', message, meta);
    this.name = 'ForbiddenError';
  }
}

/**
 * Discriminated-union result type cho server-action wrappers.
 * Client component (Epic D) sẽ dùng type guard `if (result.ok)` để render UI.
 */
export type CommandResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };
