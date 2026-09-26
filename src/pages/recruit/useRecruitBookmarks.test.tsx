import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import client from '../../shared/api/client'
import { recruitsApi, type RecruitItem } from '../../shared/api/recruits'
import { useAuth } from '../../shared/auth/AuthContext'
import { useRecruitBookmarks } from './useRecruitBookmarks'

vi.mock('../../shared/api/client', () => ({ default: { get: vi.fn(), delete: vi.fn() } }))
vi.mock('../../shared/api/recruits', () => ({ recruitsApi: { bookmark: vi.fn() } }))
vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: vi.fn() }))
const recruit = { id: 'study-1', title: 'Study', bookmarks: 1 } as RecruitItem
const auth = vi.mocked(useAuth)
afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  auth.mockReturnValue({ user: { id: 7 }, isLoggedIn: true } as ReturnType<typeof useAuth>)
})

describe('server-backed recruit bookmarks', () => {
  it('loads persisted saves without browser-local storage', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [recruit] })
    const { result } = renderHook(useRecruitBookmarks)
    await waitFor(() => expect(result.current.savedIds.has('study-1')).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/api/recruits/bookmarks/me', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })
  it('removes via DELETE and updates only after the server accepts it', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [recruit] })
    vi.mocked(client.delete).mockResolvedValue({ status: 204 })
    const { result } = renderHook(useRecruitBookmarks)
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.toggle('study-1') })
    expect(client.delete).toHaveBeenCalledWith('/api/recruits/study-1/bookmarks')
    expect(result.current.savedIds.has('study-1')).toBe(false)
  })
  it('preserves saved state when a removal fails', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [recruit] })
    vi.mocked(client.delete).mockRejectedValue(new Error('offline'))
    const { result } = renderHook(useRecruitBookmarks)
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await expect(result.current.toggle('study-1')).rejects.toThrow() })
    expect(result.current.savedIds.has('study-1')).toBe(true)
    expect(result.current.isPending('study-1')).toBe(false)
  })
  it('deduplicates clicks while a save is pending', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    let resolveSave!: (value: RecruitItem) => void
    vi.mocked(recruitsApi.bookmark).mockImplementation(() => new Promise((resolve) => { resolveSave = resolve }))
    const { result } = renderHook(useRecruitBookmarks)
    await waitFor(() => expect(result.current.loading).toBe(false))
    let pending!: ReturnType<typeof result.current.toggle>
    act(() => { pending = result.current.toggle('study-1'); void result.current.toggle('study-1') })
    expect(recruitsApi.bookmark).toHaveBeenCalledTimes(1)
    expect(result.current.savedIds.size).toBe(0)
    await act(async () => { resolveSave(recruit); await pending })
    expect(result.current.savedIds.has('study-1')).toBe(true)
  })
  it('does not expose another account saves after switching users', async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ data: [recruit] }).mockResolvedValueOnce({ data: [] })
    const { result, rerender } = renderHook(useRecruitBookmarks)
    await waitFor(() => expect(result.current.savedIds.size).toBe(1))
    auth.mockReturnValue({ user: { id: 8 }, isLoggedIn: true } as ReturnType<typeof useAuth>)
    rerender()
    expect(result.current.savedIds.size).toBe(0)
    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})
