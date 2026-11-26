import { beforeEach, describe, expect, it, vi } from 'vitest'
import client from '../../../shared/api/client'
import { createCtfApi, ctfFileUrl, ctfInstanceHref } from './api'
import type { CtfInstance } from './types'
vi.mock('../../../shared/api/client', () => ({ default: { get: vi.fn(), post: vi.fn() }, resolveApiAssetUrl: (path: string) => path }))
beforeEach(() => { vi.mocked(client.get).mockResolvedValue({ data: {} }); vi.mocked(client.post).mockResolvedValue({ data: {} }) })
describe('Coala education API contracts', () => {
  it('uses the shared authenticated client and canonical backend path', async () => {
    await createCtfApi().challenges()
    expect(client.get).toHaveBeenCalledWith('/api/education/hacking/challenges', expect.objectContaining({ timeout: 30000 }))
  })
  it('sends submissions in the body, never in URLs', async () => {
    await createCtfApi().submit('web-cors', 'test-only')
    expect(client.post).toHaveBeenCalledWith('/api/education/hacking/submit', { challenge_id: 'web-cors', flag: 'test-only' }, expect.any(Object))
  })
  it('encodes challenge identifiers and propagates cancellation', async () => {
    const signal = new AbortController().signal
    await createCtfApi().challenge('a/b', signal)
    expect(client.get).toHaveBeenCalledWith('/api/education/hacking/challenges/a%2Fb', expect.objectContaining({ signal }))
  })
  it.each(['/files/test/../answer', '/files/test/%2e%2e/answer', '/files/test/a?x', 'https://example.com/a', '/files/test/a\\b'])('rejects unsafe download path %s', (path) => expect(ctfFileUrl(path)).toBeNull())
  it('routes declared files through the private runtime-facing backend', () => expect(ctfFileUrl('/files/test/files/task.txt')).toBe('/api/education/hacking/files/test/files/task.txt'))
  it('does not make dry-run instances clickable', () => expect(ctfInstanceHref({ dry_run: true, kind: 'http', url: 'http://example.invalid' } as CtfInstance)).toBeNull())
})
