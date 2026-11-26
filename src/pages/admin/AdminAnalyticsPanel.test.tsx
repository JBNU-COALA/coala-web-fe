import { cleanup, render, screen, act } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminAnalyticsPanel } from './AdminAnalyticsPanel'

vi.mock('../../shared/analytics/analytics', () => ({ analyticsConfigured: true }))
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.useRealTimers() })

it('confirms only messages from the embedded dashboard and marks a network disconnect', () => {
  vi.stubEnv('VITE_POSTHOG_DASHBOARD_EMBED_URL', 'https://us.posthog.com/embedded/test')
  render(<AdminAnalyticsPanel />)
  const frame = screen.getByTitle('코알라 사용 분석 대시보드') as HTMLIFrameElement
  const data = { event: 'posthog:dimensions', name: 'coala-analytics', height: 400 }
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://example.com', source: frame.contentWindow, data })))
  expect(screen.queryByText('Live')).toBeNull()
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://us.posthog.com', source: frame.contentWindow, data })))
  expect(screen.getByText('Live')).toBeTruthy()
  act(() => window.dispatchEvent(new Event('offline')))
  expect(screen.getByText('연결 확인 필요')).toBeTruthy()
})

it('does not claim Live when the iframe never confirms loading', () => {
  vi.useFakeTimers()
  vi.stubEnv('VITE_POSTHOG_DASHBOARD_EMBED_URL', 'https://us.posthog.com/embedded/test')
  render(<AdminAnalyticsPanel />)
  act(() => vi.advanceTimersByTime(20000))
  expect(screen.getByText('연결 확인 필요')).toBeTruthy()
})
