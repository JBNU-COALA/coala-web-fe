import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FilterTabs } from './FilterTabs'
import { ListingControls } from './ListingControls'
import { SearchField } from './SearchField'
import { SectionNav } from './SectionNav'
import { buildContextPanel, headerSubNavItems } from '../../navigation/navigationData'

describe('shared listing navigation', () => {
  it('keeps search and filters collapsed until requested, preserving values on close', () => {
    const { container } = render(<ListingControls search={<SearchField value="" onChange={vi.fn()} placeholder="게시글 검색" />} label="게시판 필터"
      filters={<FilterTabs value="all" options={[{ id: 'all', label: '전체', icon: 'layout' }, { id: 'free', label: '자유', icon: 'message' }]} onChange={vi.fn()} ariaLabel="게시판 분류" separateFirst />}>

    </ListingControls>)
    expect(container.querySelector('.listing-controls-summary')).toBeNull()
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.getByRole('tab', { name: '전체' })).toBeTruthy()
    const trigger = screen.getByRole('button', { name: '게시판 필터 열기' })
    fireEvent.click(trigger)
    expect(screen.getByRole('searchbox')).toBeTruthy()
    expect(container.querySelectorAll('.filter-tab svg')).toHaveLength(2)
    expect(container.querySelectorAll('.filter-tab-divider')).toHaveLength(1)
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' })
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('supports arrow keys with one keyboard tab stop', () => {
    const onChange = vi.fn()
    render(<FilterTabs value="all" options={[{ id: 'all', label: '전체' }, { id: 'free', label: '자유' }]} onChange={onChange} ariaLabel="분류" />)
    fireEvent.keyDown(screen.getByRole('tab', { name: '전체' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('free')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: '자유' }))
    expect(screen.getAllByRole('tab').filter((tab) => tab.tabIndex === 0)).toHaveLength(1)
  })

  it.each(['community', 'archive', 'services'] as const)('uses identical labels and icons on %s navigation surfaces', (section) => {
    const context = buildContextPanel(section, `/${section}`)
    const expected = (headerSubNavItems[section] ?? []).map(({ id, label, icon }) => ({ id, label, icon }))
    expect(context?.items.map(({ id, label, icon }) => ({ id, label, icon }))).toEqual(expected)
    const { container } = render(<SectionNav label="하위 메뉴" items={expected} value={expected[0].id} onChange={vi.fn()} />)
    expect(container.querySelectorAll('button svg')).toHaveLength(expected.length)
  })
})
