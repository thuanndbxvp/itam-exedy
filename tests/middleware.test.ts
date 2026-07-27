/**
 * Test logic authorized callback của middleware.
 *
 * Strategy: extract logic `({ token }) => !!token` ra 1 pure function ở file riêng,
 * test pure function. Test thật NextAuth + middleware sẽ làm ở Epic E (integration test).
 */
import { isAuthorized } from '@/lib/auth-guard'

describe('isAuthorized', () => {
  test('return false khi token = null', () => {
    expect(isAuthorized(null)).toBe(false)
  })

  test('return false khi token = undefined', () => {
    expect(isAuthorized(undefined)).toBe(false)
  })

  test('return true khi token có ít nhất id', () => {
    expect(isAuthorized({ id: 'user-1' })).toBe(true)
  })

  test('return true khi token là object rỗng (Phase 2 sẽ check role thật)', () => {
    // Phase 1: chỉ cần token tồn tại. Phase 2 sẽ check token.role.
    expect(isAuthorized({})).toBe(true)
  })
})
