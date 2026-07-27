/**
 * Smoke tests cho custom error classes.
 *
 * Verify:
 * - class hierarchy đúng (NotFoundError extends DomainError extends Error)
 * - code, meta, message được set đúng
 * - instanceof check hoạt động cho discriminator catch
 */
import {
  DomainError,
  NotFoundError,
  InvalidStateError,
  ConflictError,
  LockedError,
  ValidationError,
} from '@/lib/errors';

describe('custom error classes', () => {
  test('DomainError là Error + có code + meta', () => {
    const e = new DomainError('TEST', 'something', { foo: 'bar' });
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(DomainError);
    expect(e.code).toBe('TEST');
    expect(e.message).toBe('something');
    expect(e.meta).toEqual({ foo: 'bar' });
    expect(e.name).toBe('DomainError');
  });

  test('NotFoundError set message + meta đúng', () => {
    const e = new NotFoundError('Asset', 'abc-123');
    expect(e).toBeInstanceOf(DomainError);
    expect(e).toBeInstanceOf(NotFoundError);
    expect(e.code).toBe('NOT_FOUND');
    expect(e.message).toContain('Asset');
    expect(e.message).toContain('abc-123');
    expect(e.meta).toEqual({ entityName: 'Asset', id: 'abc-123' });
  });

  test('InvalidStateError không bắt buộc meta', () => {
    const e = new InvalidStateError('not deployable');
    expect(e.code).toBe('INVALID_STATE');
    expect(e.message).toBe('not deployable');
    expect(e.meta).toBeUndefined();
  });

  test('ConflictError vs LockedError — code khác nhau', () => {
    const c = new ConflictError('plain');
    const l = new LockedError('Asset', 'x1');

    expect(c.code).toBe('CONFLICT');
    expect(l.code).toBe('LOCKED');
    // LockedError cũng là DomainError
    expect(l).toBeInstanceOf(DomainError);
    // LockedError KHÔNG là ConflictError instance (extends DomainError trực tiếp)
    expect(l).not.toBeInstanceOf(ConflictError);
  });

  test('ValidationError', () => {
    const e = new ValidationError('missing field');
    expect(e.code).toBe('VALIDATION');
  });
});
