/**
 * API helper — wrap domain errors → NextResponse với status code phù hợp.
 *
 * Mapping:
 *   - ValidationError  → 400
 *   - ForbiddenError   → 403
 *   - NotFoundError    → 404
 *   - InvalidStateError → 409
 *   - ConflictError    → 409
 *   - LockedError      → 423
 *   - DomainError (khác) → 400
 *   - Error (unknown)  → 500
 */
import { NextResponse } from "next/server";
import {
  ConflictError,
  DomainError,
  InvalidStateError,
  LockedError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "./errors";

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ValidationError) {
    return NextResponse.json({ ok: false, code: err.code, message: err.message, meta: err.meta }, { status: 400 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ ok: false, code: err.code, message: err.message, meta: err.meta }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ ok: false, code: err.code, message: err.message, meta: err.meta }, { status: 404 });
  }
  if (err instanceof ConflictError || err instanceof InvalidStateError) {
    return NextResponse.json({ ok: false, code: err.code, message: err.message, meta: err.meta }, { status: 409 });
  }
  if (err instanceof LockedError) {
    return NextResponse.json({ ok: false, code: err.code, message: err.message, meta: err.meta }, { status: 423 });
  }
  if (err instanceof DomainError) {
    return NextResponse.json({ ok: false, code: err.code, message: err.message, meta: err.meta }, { status: 400 });
  }
  console.error("[API] Unhandled error:", err);
  return NextResponse.json(
    { ok: false, code: "INTERNAL_ERROR", message: "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau." },
    { status: 500 }
  );
}

export function okResponse<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}