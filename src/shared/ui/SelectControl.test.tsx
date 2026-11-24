import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { SelectControl } from './SelectControl'

beforeAll(() => { Element.prototype.scrollIntoView = vi.fn() })
const options = [{ value: 'latest', label: '최신순' }, { value: 'popular', label: '인기순' }]

describe('SelectControl', () => {
  it('selects with arrow keys and Enter, then restores trigger focus', () => {
    const onChange = vi.fn()
    render(<SelectControl label="정렬" value="latest" options={options} onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: '정렬: 최신순' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const list = screen.getByRole('listbox')
    expect(document.activeElement).toBe(list)
    fireEvent.keyDown(list, { key: 'ArrowDown' })
    fireEvent.keyDown(list, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('popular')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('cancels with Escape or outside click without changing the value', () => {
    const onChange = vi.fn()
    render(<SelectControl label="정렬" value="latest" options={options} onChange={onChange} />)
    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)
    expect(screen.getByRole('option', { name: '최신순' }).getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    fireEvent.click(trigger)
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('selects an option with a pointer', () => {
    const onChange = vi.fn()
    render(<SelectControl label="정렬" value="latest" options={options} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('option', { name: '인기순' }))
    expect(onChange).toHaveBeenCalledWith('popular')
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
