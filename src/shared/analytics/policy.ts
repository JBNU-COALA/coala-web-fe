// Never send arbitrary URL segments, query strings, form values or account details.
const sections = new Set(['community', 'services', 'archive', 'users'])
const routeWords = new Set(['board', 'qna', 'info', 'recruit', 'activity', 'posts', 'records', 'notices', 'applications', 'new', 'editor', 'write', 'official', 'instance', 'domain', 'user', 'labs', 'agents', 'skills'])
export function analyticsRoute(pathname: string): string | null {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (/^\/(admin|settings|password-reset|email-verification)(\/|$)/.test(path)) return null
  if (['/', '/portal', '/login', '/signup', '/about', '/about/management', '/recruiting'].includes(path)) return path
  const parts = path.split('/').filter(Boolean)
  if (!sections.has(parts[0])) return null
  return '/' + parts.map((part, index) => index === 0 || routeWords.has(part) ? part : ':id').join('/')
}

export function successfulAction(method: string | undefined, url: string | undefined): string | null {
  if (method?.toLowerCase() !== 'post' || !url) return null
  const path = url.split('?')[0]
  const exact: Record<string, string> = {
    '/api/auth/login': 'login_completed', '/api/auth/signup': 'signup_submitted',
    '/api/services/instances/applications': 'instance_application_submitted',
    '/api/services/domains/applications': 'domain_application_submitted',
    '/api/archive': 'archive_created', '/api/services': 'service_created',
    '/api/recruits': 'recruit_created', '/api/info': 'info_created',
  }
  if (exact[path]) return exact[path]
  if (/^\/api\/boards\/[^/]+\/posts$/.test(path)) return 'post_created'
  if (/^\/api\/recruits\/[^/]+\/applications$/.test(path)) return 'recruit_application_submitted'
  return null
}

export function dashboardEmbedUrl(value: string | undefined): string | null {
  try {
    const url = new URL(value ?? '')
    if (url.protocol !== 'https:' || !['us.posthog.com', 'eu.posthog.com', 'app.posthog.com'].includes(url.hostname) || !url.pathname.startsWith('/embedded/') || url.username || url.password) return null
    return url.href
  } catch { return null }
}
