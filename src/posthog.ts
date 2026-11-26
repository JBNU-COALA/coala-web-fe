import posthog from 'posthog-js'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_POSTHOG_HOST
export const isPostHogConfigured = Boolean(posthogKey && posthogHost)

if (!isPostHogConfigured) {
  if (import.meta.env.DEV) {
    const missingVariable = !posthogKey ? 'VITE_POSTHOG_KEY' : 'VITE_POSTHOG_HOST'

    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    )
  }
} else {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_exceptions: true,
    logs: {
      serviceName: 'coala-web-fe',
      environment: import.meta.env.MODE,
    },
  })
}

export const posthogLogger = posthog.logger

export default posthog
