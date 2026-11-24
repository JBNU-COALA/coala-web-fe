import './auth.css'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../shared/api/auth'
import safetyLock from '../../assets/safety_lock.mp4'

type PasswordResetLocationState = {
  email?: string
}

const jbnuEmailPattern = /^[A-Za-z0-9._%+-]+@jbnu\.ac\.kr$/i

export function PasswordResetPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const stateEmail = (location.state as PasswordResetLocationState | null)?.email
  const initialEmail = useMemo(
    () => (stateEmail ?? searchParams.get('email') ?? '').trim().toLowerCase(),
    [stateEmail, searchParams],
  )

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedCode = code.replace(/\D/g, '').slice(0, 6)

  const validateEmail = () => {
    if (!jbnuEmailPattern.test(normalizedEmail)) {
      setError('전북대학교 이메일(@jbnu.ac.kr)을 입력해주세요.')
      return false
    }
    return true
  }

  const requestCode = async () => {
    setError(null)
    setMessage(null)
    if (!validateEmail()) return

    setIsSubmitting(true)
    try {
      const response = await authApi.requestPasswordReset({ email: normalizedEmail })
      setCodeSent(true)
      setMessage(response.message)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message ?? '인증번호 발송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!codeSent) {
      await requestCode()
      return
    }
    setError(null)
    setMessage(null)

    if (!validateEmail()) return
    if (normalizedCode.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.')
      return
    }
    if (newPassword.length < 8 || newPassword.length > 64) {
      setError('비밀번호는 8~64자로 입력해주세요.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authApi.confirmPasswordReset({
        email: normalizedEmail,
        code: normalizedCode,
        newPassword,
      })
      setIsCompleted(true)
      setMessage(response.message)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message ?? '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="coala-content coala-content--auth coala-content--reset">
      <article className="surface-card auth-shell email-verification-shell">
        <div className="auth-intro email-verification-intro">
          <video className="auth-lock-video" src={safetyLock} autoPlay muted playsInline preload="metadata" aria-hidden="true" />
          <h2 className="auth-title">Coala 계정의<br />비밀번호를 재설정합니다</h2>
          <p className="auth-reset-description">{isCompleted ? '새 비밀번호로 로그인해주세요.' : codeSent ? '이메일로 받은 인증번호와 새 비밀번호를 입력해주세요.' : '인증번호를 받을 이메일 계정을 입력해주세요.'}</p>
        </div>

        <form className="auth-form email-verification-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            이메일
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder="name@jbnu.ac.kr"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setCodeSent(false)
                setCode('')
                setNewPassword('')
                setConfirmPassword('')
                setMessage(null)
                setError(null)
              }}
              disabled={isSubmitting || isCompleted}
              required
            />
          </label>

          {codeSent && !isCompleted && <button
            type="button"
            className="auth-secondary-button"
            onClick={requestCode}
            disabled={isSubmitting || isCompleted}
          >
            {codeSent ? '인증번호 다시 보내기' : '인증번호 보내기'}
          </button>}

          {codeSent && !isCompleted && <><label className="auth-label">
            인증번호
            <input
              className="auth-input email-verification-code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6자리 숫자"
              value={normalizedCode}
              onChange={(event) => setCode(event.target.value)}
              disabled={isSubmitting || isCompleted}
              required
            />
          </label>

          <label className="auth-label">
            새 비밀번호
            <input
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="새 비밀번호"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={isSubmitting || isCompleted}
              required
            />
          </label>

          <label className="auth-label">
            새 비밀번호 확인
            <input
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="새 비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isSubmitting || isCompleted}
              required
            />
          </label></>}

          {message ? (
            <p role="status" className={isCompleted ? 'auth-success' : 'auth-helper-panel'}>{message}</p>
          ) : null}
          {error ? <p role="alert" className="auth-error">{error}</p> : null}

          <div className="auth-reset-actions">
          <Link className="auth-reset-back" to="/login">로그인으로 돌아가기</Link>
          {isCompleted ? (
            <button type="button" className="auth-submit" onClick={() => navigate('/login', { replace: true })}>
              로그인으로 이동
            </button>
          ) : (
            <button type="submit" className="auth-submit" disabled={isSubmitting || !normalizedEmail}>
              {isSubmitting ? (codeSent ? '변경 중...' : '발송 중...') : codeSent ? '변경' : '다음'}
            </button>
          )}

          </div>
        </form>
      </article>
    </section>
  )
}
