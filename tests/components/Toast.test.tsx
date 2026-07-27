/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/components/Toast'

function ToastHarness() {
  const { show, showCommandResult } = useToast()
  return (
    <>
      <button onClick={() => show({ type: 'success', message: 'Đã lưu thành công' })}>Show success</button>
      <button onClick={() => showCommandResult({ ok: false, code: 'FORBIDDEN', message: 'Không có quyền' })}>Show error</button>
    </>
  )
}

describe('ToastProvider', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  test('show hiển thị success message', async () => {
    render(<ToastProvider><ToastHarness /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Show success' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Đã lưu thành công')
  })

  test('showCommandResult hiển thị code và error message', async () => {
    render(<ToastProvider><ToastHarness /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Show error' }))

    expect(screen.getByRole('alert')).toHaveTextContent('FORBIDDENKhông có quyền')
  })

  test('toast tự clear sau 5 giây', () => {
    jest.useFakeTimers()
    render(<ToastProvider><ToastHarness /></ToastProvider>)
    act(() => screen.getByRole('button', { name: 'Show success' }).click())

    act(() => jest.advanceTimersByTime(5_000))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
