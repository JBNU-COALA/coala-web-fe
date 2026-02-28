import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'

type AuthMode = 'login' | 'signup'

type AuthPageProps = {
  mode: AuthMode
  onSwitchMode: () => void
}

export function AuthPage({ mode, onSwitchMode }: AuthPageProps) {
  const isLogin = mode === 'login'
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [studentId, setStudentId] = useState('')
  const [academicStatus, setAcademicStatus] = useState<'ENROLLED' | 'ON_LEAVE' | 'GRADUATED'>('ENROLLED')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!isLogin && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await signup({ email, password, name, department, studentId, academicStatus })
      }
      navigate('/')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message ?? '요청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="coala-content coala-content--auth">
      <article className="surface-card auth-shell">
        <div className="auth-intro">
          <p className="auth-eyebrow">동아리 코알라</p>
          <h2 className="auth-title">
            {isLogin ? '다시 오신 것을 환영해요.' : '동아리 코알라에 가입하세요.'}
          </h2>
          <p className="auth-description">
            {isLogin
              ? '커뮤니티, 정보공유, 스터디 모집 기능을 이용하려면 로그인하세요.'
              : '회원가입 후 커뮤니티 게시판, 자료 공유, 알림 기능을 사용할 수 있습니다.'}
          </p>
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
              placeholder="you@coala.club"
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
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>

              <label className="auth-label">
                학과
                <input
                  className="auth-input"
                  type="text"
                  placeholder="학과를 입력하세요 (예: 컴퓨터공학과)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </label>

              <label className="auth-label">
                학번
                <input
                  className="auth-input"
                  type="text"
                  placeholder="학번을 입력하세요 (예: 202012345)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </label>

              <label className="auth-label">
                재학 상태
                <select
                  className="auth-input"
                  value={academicStatus}
                  onChange={(e) => setAcademicStatus(e.target.value as 'ENROLLED' | 'ON_LEAVE' | 'GRADUATED')}
                  required
                >
                  <option value="ENROLLED">재학</option>
                  <option value="ON_LEAVE">휴학</option>
                  <option value="GRADUATED">졸업</option>
                </select>
              </label>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>

          <button type="button" className="auth-switch" onClick={onSwitchMode}>
            {isLogin ? '아직 계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
          </button>
        </form>
      </article>
    </section>
  )
}
