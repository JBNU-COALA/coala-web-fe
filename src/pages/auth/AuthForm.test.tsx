import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthForm } from './AuthForm'

describe('AuthForm validation', () => {
  it('blocks empty fields and clears the accessible message while typing', () => {
    const submit = vi.fn()
    render(<AuthForm aria-label="로그인" onSubmit={submit}><input aria-label="이메일" type="email" required /><button>로그인</button></AuthForm>)
    fireEvent.submit(screen.getByRole('form'))
    const input = screen.getByRole('textbox')
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe('필수 입력 항목입니다.')
    expect(document.activeElement).toBe(input)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    fireEvent.input(input, { target: { value: 'test' } })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })

  it('rejects malformed email and submits valid values', () => {
    const submit = vi.fn((event) => event.preventDefault())
    render(<AuthForm aria-label="로그인" onSubmit={submit}><input aria-label="이메일" type="email" required /><button>로그인</button></AuthForm>)
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'test' } })
    fireEvent.submit(screen.getByRole('form'))
    expect(screen.getByRole('alert').textContent).toBe('올바른 이메일 주소를 입력해주세요.')
    expect(submit).not.toHaveBeenCalled()
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'test@example.com' } })
    fireEvent.submit(screen.getByRole('form'))
    expect(submit).toHaveBeenCalledOnce()
  })
})
