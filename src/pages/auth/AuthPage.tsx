import './auth.css'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'
import { routes } from '../../shared/routes'

type AuthMode = 'login' | 'signup'

type AuthPageProps = {
  mode: AuthMode
  onSwitchMode: () => void
}

type SignupGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
type AcademicStatus = 'PROFESSOR' | 'ASSISTANT' | 'ENROLLED' | 'ON_LEAVE' | 'GRADUATED' | 'GENERAL'

const githubUsernamePattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/
const linkedinProfilePattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/
const jbnuEmailPattern = /^[A-Za-z0-9._%+-]+@jbnu\.ac\.kr$/i
const DEFAULT_DEPARTMENT = '컴퓨터인공지능학부'

export function AuthPage({ mode, onSwitchMode }: AuthPageProps) {
  const isLogin = mode === 'login'
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState<SignupGender>('MALE')
  const [studentId, setStudentId] = useState('')
  const [academicStatus, setAcademicStatus] = useState<AcademicStatus>('ENROLLED')
  const [grade, setGrade] = useState(1)
  const [customLab, setCustomLab] = useState('')
  const [githubId, setGithubId] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()

    if (!isLogin && !jbnuEmailPattern.test(normalizedEmail)) {
      setError('전북대학교 이메일(@jbnu.ac.kr)만 사용할 수 있습니다.')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    const trimmedGithubId = githubId.trim()
    const trimmedLinkedinUrl = linkedinUrl.trim()
    const resolvedLab = customLab.trim()

    if (!isLogin && !githubUsernamePattern.test(trimmedGithubId)) {
      setError('GitHub 아이디를 확인해주세요.')
      return
    }

    if (!isLogin && trimmedLinkedinUrl && !linkedinProfilePattern.test(trimmedLinkedinUrl)) {
      setError('LinkedIn URL은 https://www.linkedin.com/in/아이디 형식으로 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        await login(normalizedEmail, password)
      } else {
        const response = await signup({
          email: normalizedEmail,
          password,
          name: name.trim(),
          gender,
          studentId: studentId.trim(),
          department: academicStatus === 'GENERAL' ? '일반' : DEFAULT_DEPARTMENT,
          lab: resolvedLab || undefined,
          academicStatus,
          grade,
          githubId: trimmedGithubId,
          linkedinUrl: trimmedLinkedinUrl || undefined,
        })
        navigate(routes.auth.verifyEmail, {
          replace: true,
          state: { email: response.email },
        })
        return
      }
      navigate(redirectTo, { replace: true })
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; errorCode?: string } } }
      if (isLogin && axiosError.response?.data?.errorCode === 'EMAIL_NOT_VERIFIED') {
        navigate(`${routes.auth.verifyEmail}?email=${encodeURIComponent(normalizedEmail)}`, {
          replace: true,
          state: { email: normalizedEmail },
        })
        return
      }
      setError(axiosError.response?.data?.message ?? '요청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="coala-content coala-content--auth">
      <article className="surface-card auth-shell">
        <div className="auth-intro">
          <h2 className="auth-title">{isLogin ? '로그인' : '회원가입'}</h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="auth-label">
              이름
              <input
                className="auth-input"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}

          <label className="auth-label">
            이메일
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              placeholder="name@jbnu.ac.kr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            비밀번호
            <input
              className="auth-input"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {!isLogin && (
            <>
              <label className="auth-label">
                비밀번호 확인
                <input
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>

              <div className="auth-form-grid">
                <label className="auth-label">
                  성별
                  <select
                    className="auth-input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as SignupGender)}
                    required
                  >
                    <option value="MALE">남성</option>
                    <option value="FEMALE">여성</option>
                    <option value="OTHER">기타</option>
                    <option value="PREFER_NOT_TO_SAY">응답하지 않음</option>
                  </select>
                </label>

                <label className="auth-label">
                  학년
                  <select
                    className="auth-input"
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6].map((value) => (
                      <option key={value} value={value}>
                        {value}학년
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="auth-label">
                학번
                <input
                  className="auth-input"
                  type="text"
                  placeholder="예: 202012345"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </label>

              <label className="auth-label">
                학적
                <select
                  className="auth-input"
                  value={academicStatus}
                  onChange={(e) => setAcademicStatus(e.target.value as AcademicStatus)}
                  required
                >
                  <option value="PROFESSOR">교수</option>
                  <option value="ASSISTANT">조교</option>
                  <option value="ENROLLED">재학생</option>
                  <option value="ON_LEAVE">휴학생</option>
                  <option value="GRADUATED">졸업생</option>
                  <option value="GENERAL">일반</option>
                </select>
              </label>

              <label className="auth-label">
                연구실 (선택)
                <input className="auth-input" type="text" maxLength={120}
                  placeholder="소속 연구실명" value={customLab}
                  onChange={(event) => setCustomLab(event.target.value)} />
              </label>

              <label className="auth-label">
                GitHub 아이디
                <input
                  className="auth-input"
                  type="text"
                  placeholder="예: coala-dev"
                  value={githubId}
                  onChange={(e) => setGithubId(e.target.value)}
                  required
                />
                <span className="auth-helper">
                  GitHub 계정이 없다면{' '}
                  <a href="https://github.com/signup" target="_blank" rel="noreferrer">
                    GitHub 가입하기
                  </a>
                </span>
              </label>

              <label className="auth-label">
                LinkedIn 프로필 URL <span className="auth-optional">선택</span>
                <input
                  className="auth-input"
                  type="url"
                  placeholder="https://www.linkedin.com/in/coala-dev"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </label>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>

          {isLogin ? (
            <button
              type="button"
              className="auth-switch"
              onClick={() => navigate(routes.auth.passwordReset, { state: { email: email.trim().toLowerCase() } })}
            >
              비밀번호를 잊으셨나요? 비밀번호 변경
            </button>
          ) : null}

          <button type="button" className="auth-switch" onClick={onSwitchMode}>
            {isLogin ? '아직 계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
          </button>
        </form>
      </article>
    </section>
  )
}
