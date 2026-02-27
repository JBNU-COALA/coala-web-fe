type AuthMode = 'login' | 'signup'

type AuthPageProps = {
  mode: AuthMode
  onSwitchMode: () => void
}

export function AuthPage({ mode, onSwitchMode }: AuthPageProps) {
  const isLogin = mode === 'login'

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

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          {!isLogin ? (
            <label className="auth-label">
              이름
              <input className="auth-input" type="text" placeholder="이름을 입력하세요" />
            </label>
          ) : null}

          <label className="auth-label">
            이메일
            <input className="auth-input" type="email" placeholder="you@coala.club" />
          </label>

          <label className="auth-label">
            비밀번호
            <input className="auth-input" type="password" placeholder="비밀번호를 입력하세요" />
          </label>

          {!isLogin ? (
            <label className="auth-label">
              비밀번호 확인
              <input className="auth-input" type="password" placeholder="비밀번호를 다시 입력하세요" />
            </label>
          ) : null}

          <button type="submit" className="auth-submit">
            {isLogin ? '로그인' : '회원가입'}
          </button>

          <button type="button" className="auth-switch" onClick={onSwitchMode}>
            {isLogin ? '아직 계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
          </button>
        </form>
      </article>
    </section>
  )
}
