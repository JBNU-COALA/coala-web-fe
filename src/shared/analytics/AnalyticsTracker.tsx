import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { track } from './analytics'
import { analyticsRoute } from './policy'

export function AnalyticsTracker() {
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const lastPage = useRef('')
  useEffect(() => {
    const pageKey = `${location.key}:${location.pathname}`
    if (lastPage.current === pageKey) return
    lastPage.current = pageKey
    const route = analyticsRoute(location.pathname)
    if (route) void track('$pageview', { route, authenticated: isLoggedIn })
  }, [location.key, location.pathname, isLoggedIn])
  useEffect(() => {
    const clicked = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const link = event.target.closest('a[href]')
      if (!link) return
      const target = new URL(link.getAttribute('href')!, window.location.origin)
      if (target.origin !== window.location.origin) return
      const route = analyticsRoute(window.location.pathname)
      const destination = analyticsRoute(target.pathname)
      if (route && destination) void track('navigation_clicked', { route, destination })
    }
    document.addEventListener('click', clicked, true)
    return () => document.removeEventListener('click', clicked, true)
  }, [])
  return null
}
