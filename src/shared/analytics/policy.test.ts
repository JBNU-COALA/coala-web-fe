import { describe, expect, it } from 'vitest'
import { analyticsRoute, dashboardEmbedUrl, successfulAction } from './policy'

describe('analytics privacy boundaries', () => {
  it('excludes administration and private account routes', () => {
    for (const path of ['/admin', '/admin/users', '/settings', '/password-reset?token=secret', '/email-verification']) expect(analyticsRoute(path)).toBeNull()
  })
  it('removes queries, fragments and user/content identifiers', () => {
    expect(analyticsRoute('/users/someone@example.com?tab=activity')).toBe('/users/:id')
    expect(analyticsRoute('/community/board/42/posts/987?search=private#secret')).toBe('/community/board/:id/posts/:id')
    expect(analyticsRoute('/archive/labs/private-name/editor')).toBe('/archive/labs/:id/editor')
    expect(analyticsRoute('/unknown/private')).toBeNull()
  })
  it('only counts approved completion endpoints, never arbitrary writes', () => {
    expect(successfulAction('post', '/api/services/instances/applications')).toBe('instance_application_submitted')
    expect(successfulAction('post', '/api/boards/1/posts')).toBe('post_created')
    expect(successfulAction('get', '/api/boards/1/posts')).toBeNull()
    expect(successfulAction('post', '/api/admin/banners')).toBeNull()
    expect(successfulAction('post', '/api/auth/password-reset/request')).toBeNull()
  })
  it('only embeds official HTTPS PostHog sharing URLs', () => {
    expect(dashboardEmbedUrl('https://us.posthog.com/embedded/example')).toBe('https://us.posthog.com/embedded/example')
    for (const url of ['javascript:alert(1)', 'https://us.posthog.com.evil.com/embedded/a', 'https://us.posthog.com/project/1', 'http://us.posthog.com/embedded/a']) expect(dashboardEmbedUrl(url)).toBeNull()
  })
})
