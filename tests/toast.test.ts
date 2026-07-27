/**
 * Test cho src/components/Toast.tsx — Epic D MVP Polish.
 *
 * KHÔNG dùng React Testing Library (workspace rule: KHÔNG thêm dependency mới).
 * Test pure predicates `isCommandSuccess` / `isCommandError` đã tách ra từ component.
 *
 * Phần render (Toast UI) sẽ được manual test ở Phase 1 verification.
 */
import { isCommandSuccess, isCommandError } from '@/components/Toast';

describe('Toast.isCommandSuccess (pure predicate)', () => {
  test('CommandResult ok=true → true', () => {
    expect(isCommandSuccess({ ok: true, data: { id: '123' } })).toBe(true);
  });

  test('CommandResult ok=false → false', () => {
    expect(isCommandSuccess({ ok: false, code: 'X', message: 'y' })).toBe(false);
  });

  test('null → false', () => {
    expect(isCommandSuccess(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(isCommandSuccess(undefined)).toBe(false);
  });

  test('string → false', () => {
    expect(isCommandSuccess('ok')).toBe(false);
  });

  test('object thiếu ok → false', () => {
    expect(isCommandSuccess({ data: {} })).toBe(false);
  });

  test('object có ok=true (không cần data) → true', () => {
    expect(isCommandSuccess({ ok: true })).toBe(true);
  });
});

describe('Toast.isCommandError (pure predicate)', () => {
  test('CommandResult ok=false + code string + message string → true', () => {
    expect(
      isCommandError({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy' })
    ).toBe(true);
  });

  test('CommandResult ok=true → false', () => {
    expect(isCommandError({ ok: true, data: {} })).toBe(false);
  });

  test('code không phải string → false', () => {
    expect(isCommandError({ ok: false, code: 42, message: 'y' })).toBe(false);
  });

  test('message không phải string → false', () => {
    expect(isCommandError({ ok: false, code: 'X', message: null })).toBe(false);
  });

  test('null → false', () => {
    expect(isCommandError(null)).toBe(false);
  });

  test('undefined → false', () => {
    expect(isCommandError(undefined)).toBe(false);
  });
});

describe('Toast component contract (static analysis)', () => {
  test('file exports useToast hook + ToastProvider component', () => {
    const mod = require('@/components/Toast');
    expect(typeof mod.useToast).toBe('function');
    expect(typeof mod.ToastProvider).toBe('function');
  });
});