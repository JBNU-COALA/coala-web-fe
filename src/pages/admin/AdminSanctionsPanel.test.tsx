import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import client from '../../shared/api/client'
import { AdminSanctionsPanel } from './AdminSanctionsPanel'
beforeEach(() => { vi.spyOn(client, 'get').mockResolvedValue({ data: [{ id: 4, type: 'POST_RESTRICTED', reason: '기존 제재 사유', startAt: '2026-11-27T10:00:00', endAt: null, active: true, canRevoke: true }] }); vi.spyOn(client, 'post').mockResolvedValue({}) })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('confirms a nonempty release reason and refreshes without deleting the original history', async () => {
  render(<AdminSanctionsPanel userId={7} refreshKey={0} canRevoke />)
  fireEvent.click(await screen.findByRole('button', { name: '해제' }))
  expect((screen.getByRole('button', { name: '해제 확인' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(screen.getByLabelText('제재 해제 사유'), { target: { value: '재검토 완료' } })
  fireEvent.click(screen.getByRole('button', { name: '해제 확인' }))
  await screen.findByText('제재를 해제했습니다.')
  expect(client.post).toHaveBeenCalledExactlyOnceWith('/api/admin/moderation/sanctions/4/revoke', { reason: '재검토 완료' })
  await waitFor(() => expect(client.get).toHaveBeenCalledTimes(2))
})
it('does not offer a release control for a protected moderator account', async () => {
  render(<AdminSanctionsPanel userId={7} refreshKey={0} canRevoke={false} />)
  await screen.findByText('기존 제재 사유')
  expect(screen.queryByRole('button', { name: '해제' })).toBeNull()
})
