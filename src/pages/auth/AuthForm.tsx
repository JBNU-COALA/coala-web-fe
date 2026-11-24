import { useEffect, useId, useLayoutEffect, useState, type ComponentProps } from 'react'
import { createPortal } from 'react-dom'

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

export function AuthForm({ onSubmit, children, ...props }: ComponentProps<'form'>) {
  const [invalidField, setInvalidField] = useState<Field | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 280 })
  const messageId = useId()
  const message = invalidField?.validity.valueMissing ? '필수 입력 항목입니다.'
    : invalidField instanceof HTMLInputElement && invalidField.type === 'email' && invalidField.validity.typeMismatch
      ? '올바른 이메일 주소를 입력해주세요.' : invalidField?.validationMessage

  useLayoutEffect(() => {
    if (!invalidField) return
    const reposition = () => {
      const rect = invalidField.getBoundingClientRect()
      const width = Math.min(300, window.innerWidth - 32)
      setPosition({ top: Math.min(rect.bottom + 8, window.innerHeight - 72), left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)), width })
    }
    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => { window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true) }
  }, [invalidField])

  useEffect(() => {
    if (!invalidField) return
    const describedBy = invalidField.getAttribute('aria-describedby')
    const invalid = invalidField.getAttribute('aria-invalid')
    invalidField.setAttribute('aria-describedby', [describedBy, messageId].filter(Boolean).join(' '))
    invalidField.setAttribute('aria-invalid', 'true')
    return () => {
      if (describedBy === null) invalidField.removeAttribute('aria-describedby')
      else invalidField.setAttribute('aria-describedby', describedBy)
      if (invalid === null) invalidField.removeAttribute('aria-invalid')
      else invalidField.setAttribute('aria-invalid', invalid)
    }
  }, [invalidField, messageId])

  const submit = (event: Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]) => {
    const field = event.currentTarget.querySelector<Field>('input:invalid, select:invalid, textarea:invalid')
    if (field) {
      event.preventDefault()
      field.focus()
      setInvalidField(field)
      return
    }
    setInvalidField(null)
    onSubmit?.(event)
  }

  return <form {...props} noValidate onSubmit={submit}
    onInputCapture={() => setInvalidField(null)}
    onChangeCapture={() => setInvalidField(null)}
    onBlurCapture={() => setInvalidField(null)}
    onKeyDownCapture={(event) => { if (event.key === 'Escape') setInvalidField(null) }}>
    {children}
    {invalidField && createPortal(<div id={messageId} className="auth-validation-tip" role="alert" style={position}>{message}</div>, document.body)}
  </form>
}
