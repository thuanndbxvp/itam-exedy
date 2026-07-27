/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import RoleGate from '@/components/RoleGate'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))

const { useSession } = jest.requireMock('next-auth/react') as { useSession: jest.Mock }

describe('RoleGate', () => {
  test('ADMIN thấy children được cho phép', () => {
    useSession.mockReturnValue({ data: { user: { role: 'ADMIN' } }, status: 'authenticated' })
    render(<RoleGate allowedRoles={['ADMIN']}><button>Admin action</button></RoleGate>)

    expect(screen.getByRole('button', { name: 'Admin action' })).toBeInTheDocument()
  })

  test('EMPLOYEE không thấy children chỉ dành cho ADMIN', () => {
    useSession.mockReturnValue({ data: { user: { role: 'EMPLOYEE' } }, status: 'authenticated' })
    render(<RoleGate allowedRoles={['ADMIN']}><button>Admin action</button></RoleGate>)

    expect(screen.queryByRole('button', { name: 'Admin action' })).not.toBeInTheDocument()
  })

  test('loading render fallback', () => {
    useSession.mockReturnValue({ data: null, status: 'loading' })
    render(<RoleGate allowedRoles={['ADMIN']} fallback={<span>Đang tải quyền</span>}>Hidden</RoleGate>)

    expect(screen.getByText('Đang tải quyền')).toBeInTheDocument()
  })
})
