import type { PostHog } from 'posthog-js'
import { analyticsRoute, successfulAction } from './policy'

const token = (import.meta.env.VITE_POSTHOG_PROJECT_TOKEN ?? '').trim()
const host = (import.meta.env.VITE_POSTHOG_HOST ?? '').trim()
export const analyticsConfigured = Boolean(token && ['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(host))
const enabled = analyticsConfigured && (import.meta.env.PROD || import.meta.env.VITE_POSTHOG_ENABLE_DEV === 'true')
let client: PostHog | undefined
let loading: Promise<PostHog | undefined> | undefined
const allowedProperties = new Set(['token', 'distinct_id', '$device_id', '$session_id', '$window_id', '$process_person_profile', '$is_identified', '$lib', '$lib_version', '$browser', '$browser_version', '$os', '$os_version', '$device_type', '$screen_height', '$screen_width', '$viewport_height', '$viewport_width', '$current_url', '$pathname', 'route', 'destination', 'authenticated', 'source'])

async function getClient() {
  if (!enabled) return undefined
  if (client) return client
  if (!loading) loading = import('posthog-js').then(({ default: posthog }) => {
    posthog.init(token, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      capture_performance: false,
      capture_exceptions: false,
      advanced_disable_feature_flags: true,
      person_profiles: 'never',
      save_referrer: false,
      save_campaign_params: false,
      persistence: 'localStorage',
      before_send: event => {
        if (!event || !analyticsRoute(window.location.pathname)) return null
        // SDK-enriched properties can contain referrers, search terms and titles.
        event.properties = Object.fromEntries(Object.entries(event.properties ?? {}).filter(([key]) => allowedProperties.has(key)))
        return event
      },
    })
    client = posthog
    return client
  }).catch(() => { loading = undefined; return undefined })
  return loading
}

export async function track(event: string, properties: { route: string; destination?: string; authenticated?: boolean }) {
  if (!enabled || !analyticsRoute(window.location.pathname)) return
  const instance = await getClient()
  if (!analyticsRoute(window.location.pathname)) return
  try {
    instance?.capture(event, { ...properties, $pathname: properties.route, $current_url: window.location.origin + properties.route, source: 'coala-web' })
  } catch { /* Analytics failures must never interrupt the application. */ }
}

export function trackSuccessfulRequest(method?: string, url?: string) {
  const event = successfulAction(method, url)
  const route = analyticsRoute(window.location.pathname)
  if (event && route) void track(event, { route })
  const wizardAliases: Record<string, string> = {
    post_created: 'post_published', info_created: 'post_published', recruit_created: 'recruitment_published',
    recruit_application_submitted: 'recruitment_application_submitted', archive_created: 'archive_item_created',
    instance_application_submitted: 'jcloud_application_submitted',
  }
  if (event && route && wizardAliases[event]) void track(wizardAliases[event], { route })
}
