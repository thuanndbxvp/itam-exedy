/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import Modal from '@/components/ui/Modal'

describe('Modal', () => {
  test('open=false không render dialog', () => {
    render(<Modal open={false} onClose={jest.fn()} title="Chi tiết">Content</Modal>)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('open=true render title và content', () => {
    render(<Modal open onClose={jest.fn()} title="Chi tiết">Nội dung modal</Modal>)

    expect(screen.getByRole('dialog', { name: 'Chi tiết' })).toHaveTextContent('Nội dung modal')
  })

  test('click backdrop gọi onClose', () => {
    const onClose = jest.fn()
    const { container } = render(<Modal open onClose={onClose} title="Đóng">Content</Modal>)
    const backdrop = container.ownerDocument.querySelector('[aria-hidden="true"]')
    if (!backdrop) throw new Error('Backdrop không render')
    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('nhấn Escape gọi onClose', () => {
    const onClose = jest.fn()
    render(<Modal open onClose={onClose} title="Đóng">Content</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
