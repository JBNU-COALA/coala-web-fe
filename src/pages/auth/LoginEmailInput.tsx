import { useId, useLayoutEffect, useRef } from 'react'
import { LOGIN_EMAIL_DOMAIN, normalizeLoginEmail } from './loginEmail'

export function LoginEmailInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const showDomain = !value.includes('@')
  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return
    const probe = document.createElement('input')
    probe.type = 'email'; probe.required = true; probe.value = normalizeLoginEmail(value)
    input.setCustomValidity(value && probe.validity.valueMissing ? '필수 입력 항목입니다.' : probe.validity.typeMismatch ? '올바른 이메일 주소를 입력해주세요.' : '')
  }, [value])
  return <div className={`auth-email-field${showDomain ? ' has-default-domain' : ''}`}>
    <input ref={ref} className="auth-input" name="email" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
      placeholder="아이디 또는 이메일" value={value} onChange={(event) => onChange(event.target.value)} aria-label="이메일" aria-describedby={hintId} required />
    {showDomain && <span className="auth-email-domain" aria-hidden="true">{LOGIN_EMAIL_DOMAIN}</span>}
    <span id={hintId} className="auth-email-hint">아이디만 입력하면 {LOGIN_EMAIL_DOMAIN} 주소로 로그인합니다.</span>
  </div>
}
