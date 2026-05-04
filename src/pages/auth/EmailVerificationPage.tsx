import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../shared/api/auth'

type VerificationLocationState = {
  email?: string
}

const jbnuEmailPattern = /^[A-Za-z0-9._%+-]+@jbnu\.ac\.kr$/i

export function EmailVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const stateEmail = (location.state as VerificationLocationState | null)?.email
  const initialEmail = useMemo(
    () => (stateEmail ?? searchParams.get('email') ?? '').trim().toLowerCase(),
    [stateEmail, searchParams],
  )

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(
    initialEmail ? '메일로 받은 인증번호를 입력해주세요.' : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedCode = code.replace(/\D/g, '').slice(0, 6)

  const validateEmail = () => {
    if (!jbnuEmailPattern.test(normalizedEmail)) {
      setError('전북대학교 이메일(@jbnu.ac.kr)을 입력해주세요.')
      return false
    }
    return true
  }

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!validateEmail()) return
    if (normalizedCode.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authApi.confirmEmailVerification(normalizedEmail, normalizedCode)
      setIsVerified(response.verified)
      setMessage(response.message)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message ?? '인증에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError(null)
    setMessage(null)
    if (!validateEmail()) return

    setIsSubmitting(true)
    try {
      const response = await authApi.resendEmailVerification(normalizedEmail)
      setIsVerified(response.verified)
      setMessage(response.message)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message ?? '인증 메일 발송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="coala-content coala-content--auth">
      <article className="surface-card auth-shell email-verification-shell">
        <div className="auth-intro email-verification-intro">
          <h2 className="auth-title">이메일 인증</h2>
        </div>

        <form className="auth-form email-verification-form" onSubmit={handleVerify}>
          <label className="auth-label">
            이메일
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder="name@jbnu.ac.kr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting || isVerified}
              required
            />
          </label>

          <label className="auth-label">
            인증번호
            <input
              className="auth-input email-verification-code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6자리 숫자"
              value={normalizedCode}
              onChange={(event) => setCode(event.target.value)}
              disabled={isSubmitting || isVerified}
              required
            />
          </label>

          {message ? (
            <p className={isVerified ? 'auth-success' : 'auth-helper-panel'}>{message}</p>
          ) : null}
          {error ? <p className="auth-error">{error}</p> : null}

          {isVerified ? (
            <button type="button" className="auth-submit" onClick={() => navigate('/login', { replace: true })}>
              로그인으로 이동
            </button>
          ) : (
            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? '확인 중...' : '인증하기'}
            </button>
          )}

          <button
            type="button"
            className="auth-switch email-verification-resend"
            onClick={handleResend}
            disabled={isSubmitting || isVerified}
          >
            인증 메일 다시 보내기
          </button>

          <Link className="auth-switch email-verification-link" to="/login">
            로그인으로 돌아가기
          </Link>
        </form>
      </article>
    </section>
  )
}
