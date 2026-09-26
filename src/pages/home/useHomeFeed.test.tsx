import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { boardsApi } from '../../shared/api/boards'
import { infoApi } from '../../shared/api/info'
import { servicesApi } from '../../shared/api/services'
import { recruitsApi } from '../../shared/api/recruits'
import { postsApi } from '../../shared/api/posts'
import { useHomeFeed } from './useHomeFeed'

vi.mock('../../shared/api/boards', () => ({ boardsApi: { getBoards: vi.fn() } }))
vi.mock('../../shared/api/info', () => ({ infoApi: { getArticles: vi.fn() } }))
vi.mock('../../shared/api/services', () => ({ servicesApi: { getMemberServices: vi.fn() } }))
vi.mock('../../shared/api/recruits', () => ({ recruitsApi: { getRecruits: vi.fn() } }))
vi.mock('../../shared/api/posts', () => ({ postsApi: { getPosts: vi.fn() } }))
beforeEach(() => {
  vi.mocked(boardsApi.getBoards).mockResolvedValue([])
  vi.mocked(infoApi.getArticles).mockResolvedValue([])
  vi.mocked(servicesApi.getMemberServices).mockResolvedValue([])
  vi.mocked(recruitsApi.getRecruits).mockResolvedValue([])
  vi.mocked(postsApi.getPosts).mockReset().mockResolvedValue([])
})

describe('home feed API scope', () => {
  it('does not fetch anonymous boards when no public category is found', async () => {
    vi.mocked(boardsApi.getBoards).mockResolvedValue([{ boardId: 99, boardName: '질문', boardType: 'ANONYMOUS', description: '', isActive: true, createdAt: '', updatedAt: '' }])
    const { result } = renderHook(useHomeFeed)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(postsApi.getPosts).not.toHaveBeenCalled()
  })
  it('keeps successful feeds and reports failed domains separately', async () => {
    vi.mocked(infoApi.getArticles).mockRejectedValue(new Error('offline'))
    const { result } = renderHook(useHomeFeed)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.errors.articles).toBe(true)
    expect(result.current.errors.services).toBe(false)
    expect(result.current.errors.posts).toBe(false)
  })
})
