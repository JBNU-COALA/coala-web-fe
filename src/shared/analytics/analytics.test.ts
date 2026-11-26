import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const sdk = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }))
vi.mock('posthog-js', () => ({ default: sdk }))

beforeEach(() => {
  vi.resetModules(); sdk.init.mockClear(); sdk.capture.mockClear()
  window.history.replaceState({}, '', '/portal')
  vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test_public_token')
  vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com')
  vi.stubEnv('VITE_POSTHOG_ENABLE_DEV', 'true')
})
afterEach(() => { vi.unstubAllEnvs(); window.history.replaceState({}, '', '/') })

describe('PostHog integration', () => {
  it('does not initialize without project configuration', async () => {
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', '')
    const { track } = await import('./analytics')
    await track('$pageview', { route: '/portal' })
    expect(sdk.init).not.toHaveBeenCalled()
  })
  it('keeps admin visits out of collection', async () => {
    window.history.replaceState({}, '', '/admin')
    const { track } = await import('./analytics')
    await track('$pageview', { route: '/admin' })
    expect(sdk.init).not.toHaveBeenCalled()
  })
  it('initializes once and strips SDK-enriched personal properties before sending', async () => {
    const { track } = await import('./analytics')
    await track('$pageview', { route: '/portal' })
    await track('navigation_clicked', { route: '/portal', destination: '/users/:id' })
    expect(sdk.init).toHaveBeenCalledTimes(1)
    const config = sdk.init.mock.calls[0][1]
    expect(config.autocapture).toBe(false)
    expect(config.disable_session_recording).toBe(true)
    const event = config.before_send({ event: '$pageview', properties: { token: 'public-token', distinct_id: 'anonymous', route: '/portal', $referrer: 'https://example.com/?email=private', email: 'private', $title: 'private' } })
    expect(event.properties).toEqual({ token: 'public-token', distinct_id: 'anonymous', route: '/portal' })
    window.history.replaceState({}, '', '/admin')
    expect(config.before_send(event)).toBeNull()
  })
})
