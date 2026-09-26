import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import client from '../../shared/api/client'
import { useProfileOverview } from './useProfileOverview'

vi.mock('../../shared/api/client', () => ({ default: { get: vi.fn() } }))
const get = vi.mocked(client.get)
afterEach(cleanup)
beforeEach(() => get.mockReset())

describe('profile overview loading', () => {
  it('loads one scoped endpoint without scanning users or boards', async () => {
    get.mockResolvedValue({ data: { isSelf: true, items: [], counts: {} } })
    const { result } = renderHook(() => useProfileOverview('7', 7))
    await waitFor(() => expect(result.current.data?.isSelf).toBe(true))
    expect(get).toHaveBeenCalledTimes(1)
    expect(get.mock.calls[0][0]).toBe('/api/users/7/overview')
  })
  it('hides previous profile results immediately and ignores a late response', async () => {
    let resolveOld!: (value: { data: { isSelf: boolean; items: never[]; counts: object } }) => void
    get.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
    get.mockResolvedValueOnce({ data: { isSelf: false, items: [], counts: { studyGroups: 2 } } })
    const { result, rerender } = renderHook(({ id }) => useProfileOverview(id, 7), { initialProps: { id: '7' } })
    rerender({ id: '8' })
    expect(result.current.data).toBeUndefined()
    await waitFor(() => expect(result.current.data?.isSelf).toBe(false))
    await act(async () => resolveOld({ data: { isSelf: true, items: [], counts: {} } }))
    expect(result.current.data?.isSelf).toBe(false)
    expect(get.mock.calls[0][1]?.signal?.aborted).toBe(true)
  })
  it('reports unavailable counts as unavailable and supports retry', async () => {
    get.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useProfileOverview('7', 7))
    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.data).toBeUndefined()
    get.mockResolvedValueOnce({ data: { isSelf: true, items: [], counts: {} } })
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.data?.isSelf).toBe(true))
    expect(result.current.error).toBeUndefined()
  })
  it('does not load private overview data for a guest', () => {
    renderHook(() => useProfileOverview('7'))
    expect(get).not.toHaveBeenCalled()
  })
})
