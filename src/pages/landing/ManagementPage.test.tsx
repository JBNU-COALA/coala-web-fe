import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ManagementPage } from './ManagementPage'

describe('ManagementPage', () => {
  it('shows the preparation state without invented generations or members', () => {
    render(<ManagementPage generations={[]} />)
    expect(screen.getByText('임원진 정보를 준비 중입니다.')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: '임원진 기수 선택' })).toBeNull()
  })

  it('switches generations and only renders the selected members', () => {
    render(<ManagementPage generations={[
      { id: 'new', label: '최근 기수', members: [{ id: 'a', name: '테스트 회원 A', role: '회장' }] },
      { id: 'old', label: '지난 기수', members: [{ id: 'b', name: '테스트 회원 B', role: '부회장', githubUrl: 'javascript:alert(1)' }] },
    ]} />)
    expect(screen.getByText('테스트 회원 A')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '이전 기수' }))
    expect(screen.queryByText('테스트 회원 A')).toBeNull()
    expect(screen.getByText('테스트 회원 B')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
    expect((screen.getByRole('button', { name: '이전 기수' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
