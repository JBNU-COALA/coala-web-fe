import { LoadErrorState } from './LoadErrorState'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { LoginRequiredState } from './LoginRequiredState'
import { servicesApi, type ServiceInquiry } from '../api/services'
import { mutationError } from '../api/mutationError'
import { useAuth } from '../auth/AuthContext'
import { Icon } from './Icon'
import './serviceInquiries.css'
import { LoadingSpinner } from './LoadingSpinner'

type InquiryKind = 'instances' | 'domains'
const serviceNames = { instances: '인스턴스', domains: '도메인' } as const

function statusMeta(status: string) {
  switch (status.trim().toLowerCase().replace(/\s+/g, '')) {
    case 'open':
    case '검토중':
    case '답변대기': return { tone: 'open', label: '검토 중' }
    case 'answered':
    case '답변완료': return { tone: 'answered', label: '답변 완료' }
    case 'closed':
    case '종료': return { tone: 'closed', label: '종료' }
    default: return { tone: 'unknown', label: status || '상태 미확인' }
  }
}

function answerDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

export function ServiceInquiries({ kind }: { kind: InquiryKind }) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn || !user) return <LoginRequiredState />
  return <AuthenticatedInquiries key={`${kind}:${user.id}`} kind={kind} />
}

function AuthenticatedInquiries({ kind }: { kind: InquiryKind }) {
  const formId = useId()
  const mounted = useRef(false)
  const submitting = useRef(false)
  const [items, setItems] = useState<ServiceInquiry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [writing, setWriting] = useState(false)
  const [draft, setDraft] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 3500)
    return () => window.clearTimeout(timer)
  }, [message])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    let active = true
    const load = kind === 'instances' ? servicesApi.getInquiries : servicesApi.getDomainInquiries
    const fetchItems = () => load()
      .then((data) => { if (active) { setItems(data); setLoadError('') } })
      .catch(() => { if (active) setLoadError('문의 내역을 불러오지 못했습니다. 다시 시도해 주세요.') })
      .finally(() => { if (active) setLoading(false) })
    let pending = false
    const refresh = async () => {
      if (pending || submitting.current) return
      pending = true
      try { await fetchItems() } finally { pending = false }
    }
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 20000)
    return () => { active = false; window.clearInterval(timer) }
  }, [kind, revision])

  const reload = () => {
    if (submitting.current || loading) return
    setLoadError('')
    setLoading(true)
    setRevision((value) => value + 1)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!mounted.current || submitting.current || loading) return
    const title = draft.title.trim()
    const content = draft.content.trim()
    if (!title || !content || title.length > 120 || content.length > 5000) {
      setSaveError('제목은 1~120자, 내용은 1~5,000자로 입력해 주세요.')
      return
    }
    submitting.current = true
    setSaving(true)
    setSaveError('')
    setMessage('')
    try {
      const create = kind === 'instances' ? servicesApi.createInquiry : servicesApi.createDomainInquiry
      const saved = await create({ title, content })
      if (!mounted.current) return
      setItems((current) => [saved, ...(current ?? []).filter((item) => item.id !== saved.id)])
      setDraft({ title: '', content: '' })
      setWriting(false)
      setMessage('문의가 등록되었습니다.')
    } catch (error) {
      if (mounted.current) setSaveError(mutationError(error, '문의를 등록하지 못했습니다. 작성 내용은 유지됩니다. 다시 시도해 주세요.'))
    } finally {
      submitting.current = false
      if (mounted.current) setSaving(false)
    }
  }

  return <section className="service-inquiries" aria-label={`${serviceNames[kind]} 문의사항`}>
    <header className="service-inquiries-header service-inquiries-header--untitled">
      <div className="service-inquiries-actions">
        <button type="button" className="service-inquiries-write" disabled={saving}
          aria-label={writing ? '작성 닫기' : '문의 작성'} data-tooltip={writing ? '작성 닫기' : '문의 작성'}
          aria-expanded={writing} aria-controls={formId} onClick={() => { setWriting((value) => !value); setMessage('') }}>
          <Icon name={writing ? 'close' : 'pencil-color'} size={14} />{writing ? '닫기' : '글 작성'}
        </button>
      </div>
    </header>

    {writing && <form id={formId} className="service-inquiries-form" onSubmit={submit}>
      <fieldset disabled={saving}>
        <label>제목<input required maxLength={120} value={draft.title}
          onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} /></label>
        <label>내용<textarea required maxLength={5000} rows={5} value={draft.content}
          onChange={(event) => setDraft((value) => ({ ...value, content: event.target.value }))} /></label>
        {saveError && <p className="service-inquiries-error" role="alert">{saveError}</p>}
        <div className="service-inquiries-form-actions">
        <button type="button" onClick={() => setWriting(false)}>취소</button>
        <button type="submit" className="service-inquiries-primary" disabled={saving || loading || !draft.title.trim() || !draft.content.trim()}>
          {saving ? '등록 중...' : '문의 등록'}
        </button>
        </div>
      </fieldset>
    </form>}
    {message && <p className="service-inquiries-feedback" role="status">{message}</p>}
    {loadError && <LoadErrorState message={loadError} onRetry={reload} disabled={saving} />}
    {!writing && loading && <LoadingSpinner label="문의 내역을 불러오는 중입니다." />}
    {!writing && !loading && !loadError && items?.length === 0 && <p className="service-inquiries-empty">등록된 문의가 없습니다.</p>}
    {!writing && <ul className="service-inquiries-list" aria-busy={loading}>
      {items?.map((item) => {
        const status = statusMeta(item.status)
        return <li key={item.id}>
          <article>
            <div className="service-inquiries-meta">
              <span className={`service-inquiries-status service-inquiries-status--${status.tone}`}>{status.label}</span>
              <span>{item.author}</span><time>{item.createdAt}</time>
            </div>
            <h4>{item.title}</h4>
            <div className="service-inquiries-question">
              <span className="service-inquiries-content-label">문의 내용</span>
              <p className="service-inquiries-content">{item.content?.trim() ? item.content : item.summary}</p>
            </div>
            {item.reply?.trim() ? <div className="service-inquiries-reply">
              <div className="service-inquiries-meta"><strong>운영진 답변</strong>
                {item.answeredAt && <time dateTime={item.answeredAt}>{answerDate(item.answeredAt)}</time>}
              </div>
              <p className="service-inquiries-content">{item.reply}</p>
            </div> : status.tone === 'open' && <p className="service-inquiries-awaiting">답변을 기다리고 있습니다.</p>}
          </article>
        </li>
      })}
    </ul>}
  </section>
}
