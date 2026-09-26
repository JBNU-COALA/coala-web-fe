import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { ProfileTasks } from './ProfileTasks'
import type { ProfileOverview } from './profileOverview'

afterEach(cleanup)
const overview: ProfileOverview = { isSelf: true, items: [], counts: {
  studyGroups: 2, studyRecords: 4, authoredPosts: 3, infoArticles: 1, recruits: 1, services: 2,
  recruitApplications: 6, pendingRecruitApplications: 2, savedRecruits: 0, instanceApplications: 1, domainApplications: 0,
} }
describe('profile quick tasks', () => {
  it('links real counts to the matching profile, recruitment and service destinations', () => {
    render(<MemoryRouter><ProfileTasks userId="7" ownProfile overview={overview} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: '활동 · 출석 4' }).getAttribute('href')).toBe('/community/activity?user=7')
    expect(screen.getByRole('link', { name: '모집 지원 6' }).getAttribute('href')).toBe('/community/recruit?view=applications')
    expect(screen.getByRole('link', { name: '작성 글 5' }).getAttribute('href')).toBe('/users/7?tab=posts')
    expect(screen.getByRole('link', { name: '관심 0' })).toBeTruthy()
  })
  it('shows unavailable counts without pretending they are zero', () => {
    render(<MemoryRouter><ProfileTasks userId="7" ownProfile /></MemoryRouter>)
    expect(screen.getByRole('link', { name: '모집 지원 -' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: '모집 지원 0' })).toBeNull()
  })
  it('does not reveal private application or saved counts on another profile', () => {
    render(<MemoryRouter><ProfileTasks userId="8" ownProfile={false} overview={overview} /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: /모집 지원/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /관심/ })).toBeNull()
    expect(screen.getByRole('link', { name: '인스턴스' })).toBeTruthy()
  })
})
