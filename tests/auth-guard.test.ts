/**
 * Test cho src/lib/auth-guard.ts — Epic C+1 RBAC.
 *
 * Test `requireRole` logic — RBAC cho server actions.
 * Strategy: mock `getServerSession` từ `next-auth` để kiểm soát session.user.role.
 * KHÔNG dùng real DB. KHÔNG dùng real NextAuth config. Pure unit test.
 */
import { requireRole } from '@/lib/auth-guard';
import { ForbiddenError, DomainError } from '@/lib/errors';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const { getServerSession } = jest.requireMock('next-auth') as {
  getServerSession: jest.Mock;
};

describe('requireRole', () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  test('requireRole("ADMIN") với session role=ADMIN → resolve (không throw)', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', firstName: 'A', lastName: 'B', email: 'a@b.com' },
    });

    await expect(requireRole('ADMIN')).resolves.toBeUndefined();
  });

  test('requireRole("ADMIN") với session role=EMPLOYEE → throw ForbiddenError code=FORBIDDEN', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'EMPLOYEE', firstName: 'A', lastName: 'B', email: 'a@b.com' },
    });

    await expect(requireRole('ADMIN')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireRole('ADMIN')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('requireRole("EMPLOYEE") với session role=EMPLOYEE → resolve', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'u2', role: 'EMPLOYEE', firstName: 'C', lastName: 'D', email: 'c@d.com' },
    });

    await expect(requireRole('EMPLOYEE')).resolves.toBeUndefined();
  });

  test('requireRole("EMPLOYEE") với session role=ADMIN → throw (admin không bị restrict nếu caller muốn EMPLOYEE)', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'u2', role: 'ADMIN', firstName: 'C', lastName: 'D', email: 'c@d.com' },
    });

    await expect(requireRole('EMPLOYEE')).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('requireRole("ADMIN") với session null → throw', async () => {
    getServerSession.mockResolvedValue(null);

    await expect(requireRole('ADMIN')).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('requireRole("ADMIN") với session.user null → throw', async () => {
    getServerSession.mockResolvedValue({ user: null });

    await expect(requireRole('ADMIN')).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('requireRole("ADMIN") với session.user thiếu role → throw', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'u3' } });

    await expect(requireRole('ADMIN')).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('ForbiddenError', () => {
  test('instanceof DomainError → true', () => {
    const e = new ForbiddenError('denied');
    expect(e).toBeInstanceOf(DomainError);
    expect(e).toBeInstanceOf(ForbiddenError);
    expect(e).toBeInstanceOf(Error);
  });

  test('code === "FORBIDDEN"', () => {
    const e = new ForbiddenError('denied');
    expect(e.code).toBe('FORBIDDEN');
  });

  test('name === "ForbiddenError"', () => {
    const e = new ForbiddenError('denied');
    expect(e.name).toBe('ForbiddenError');
  });

  test('message + meta được preserve', () => {
    const e = new ForbiddenError('no access', { requiredRole: 'ADMIN', currentRole: 'EMPLOYEE' });
    expect(e.message).toBe('no access');
    expect(e.meta).toEqual({ requiredRole: 'ADMIN', currentRole: 'EMPLOYEE' });
  });
});
