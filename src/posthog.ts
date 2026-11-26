// Compatibility entry point. Only shared/analytics/analytics.ts initializes PostHog.
import { analyticsConfigured, track } from './shared/analytics/analytics'
import { analyticsRoute } from './shared/analytics/policy'
export const isPostHogConfigured = analyticsConfigured
const capturedByApi = new Set(['post_published', 'recruitment_published', 'recruitment_application_submitted', 'archive_item_created', 'domain_application_submitted', 'jcloud_application_submitted'])
export default {
  capture(event: string, _properties?: Record<string, unknown>) {
    if (capturedByApi.has(event)) return
    const route = analyticsRoute(window.location.pathname)
    if (route && ['post_updated', 'activity_record_created', 'activity_record_updated', 'archive_item_updated'].includes(event)) void track(event, { route })
  },
}
