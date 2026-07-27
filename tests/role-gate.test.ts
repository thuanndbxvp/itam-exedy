/**
 * Test cho src/components/RoleGate.tsx — Epic D MVP Polish.
 *
 * KHÔNG dùng React Testing Library (workspace rule: KHÔNG thêm dependency mới).
 * Test pure predicate `isRoleAllowed` đã tách ra từ component.
 *
 * Strategy: verify logic mapping role → boolean cho từng case.
 * Component render (với hook useSession) sẽ được manual test ở Phase 1 verification.
 */
import { isRoleAllowed } from '@/components/RoleGate';

describe('RoleGate.isRoleAllowed (pure predicate)', () => {
  test('ADMIN session + ADMIN allowed → true', () => {
    expect(isRoleAllowed('ADMIN', ['ADMIN'])).toBe(true);
  });

  test('EMPLOYEE session + ADMIN allowed → false', () => {
    expect(isRoleAllowed('EMPLOYEE', ['ADMIN'])).toBe(false);
  });

  test('ADMIN session + allowed=[ADMIN, EMPLOYEE] → true', () => {
    expect(isRoleAllowed('ADMIN', ['ADMIN', 'EMPLOYEE'])).toBe(true);
  });

  test('EMPLOYEE session + allowed=[ADMIN, EMPLOYEE] → true', () => {
    expect(isRoleAllowed('EMPLOYEE', ['ADMIN', 'EMPLOYEE'])).toBe(true);
  });

  test('null session → false (defensive)', () => {
    expect(isRoleAllowed(null, ['ADMIN'])).toBe(false);
  });

  test('undefined session → false (defensive)', () => {
    expect(isRoleAllowed(undefined, ['ADMIN', 'EMPLOYEE'])).toBe(false);
  });

  test('empty allowedRoles → false (deny by default)', () => {
    expect(isRoleAllowed('ADMIN', [])).toBe(false);
    expect(isRoleAllowed('EMPLOYEE', [])).toBe(false);
  });
});

describe('RoleGate component contract (static analysis)', () => {
  /**
   * Vì không có RTL, ta verify component FILE bằng cách:
   * 1. Đọc source qua require — kiểm tra nó re-export `isRoleAllowed`.
   * 2. Verify default export là function (component).
   * Đủ để smoke-test file-level integrity.
   */
  test('file re-exports isRoleAllowed predicate', () => {
    // Re-import bằng require để verify module structure (không qua React render).
    const mod = require('@/components/RoleGate');
    expect(typeof mod.isRoleAllowed).toBe('function');
    expect(typeof mod.default).toBe('function'); // default export = component
  });
});