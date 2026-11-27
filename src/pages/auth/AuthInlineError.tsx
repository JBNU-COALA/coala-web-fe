import { useEffect } from 'react'

export function AuthInlineError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timer)
  }, [onDismiss])
  return <p className="auth-inline-error" role="alert">{message}</p>
}
