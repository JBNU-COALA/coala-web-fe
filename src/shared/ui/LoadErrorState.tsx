import './LoadErrorState.css'
import { useAuth } from '../auth/AuthContext'
import { LoginRequiredState } from './LoginRequiredState'

type LoadErrorStateProps = {
  message: string
  onRetry: () => void
  retryLabel?: string
  disabled?: boolean
}

export function LoadErrorState({ message, onRetry, retryLabel = '다시 불러오기', disabled = false }: LoadErrorStateProps) {
  const { isLoggedIn, isDevSession } = useAuth()
  if (isLoggedIn === false || (!isDevSession && message.startsWith('로그인이 필요합니다.'))) return <LoginRequiredState />
  return <div className="load-error-state">
    <img src="/coala-mascot-crying.png" alt="" width={72} height={72} />
    <p role="alert">{message}</p>
    <button type="button" className="retry-button" onClick={onRetry} disabled={disabled}>{retryLabel}</button>
  </div>
}
