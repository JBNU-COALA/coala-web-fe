import { useCallback, useState, type FormEvent } from 'react'
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { employmentApi, type EmploymentOutcome, type EmploymentReview, type EmploymentReviewInput } from '../../shared/api/employment'
import { featureError } from '../../shared/api/featureError'
import { useAuth } from '../../shared/auth/AuthContext'
import { RequireAuth } from '../../shared/auth/RequireAuth'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { ListingControls } from '../../shared/ui/ListingControls'
import { SearchField } from '../../shared/ui/SearchField'
import { SelectControl } from '../../shared/ui/SelectControl'
import { Pagination } from '../../shared/ui/Pagination'
import { CommunityBanner } from '../community/CommunityBanner'
import { useApiResource as useCtfResource } from '../../shared/hooks/useApiResource'
import { CtfResourceState } from '../education/hacking/CtfUi'
import { EducationEmptyState } from '../education/EducationEmptyState'
import { prepareMarkdownForDisplay } from '../../shared/markdown'
import '../education/education.css'
import './employment.css'

const root = routes.community.employment
const stages: Record<string, string> = { DOCUMENT: '서류', ASSIGNMENT: '과제', CODING: '코딩 테스트', INTERVIEW: '면접', FINAL: '최종' }
const outcomeLabel = (outcome: EmploymentOutcome) => outcome === 'ACCEPTED' ? '합격' : '불합격'
export function EmploymentPage() {
  return <section className="coala-content page-frame employment-page">
    <CommunityBanner title="취업 후기" description="합격 · 불합격 경험" headingLevel={1} />
    <div className="page-container page-frame-body"><Routes>
      <Route index element={<EmploymentListPage />} />
      <Route path="new" element={<RequireAuth><EmploymentEditor /></RequireAuth>} />
      <Route path=":reviewId/editor" element={<RequireAuth><EmploymentEditLoader /></RequireAuth>} />
      <Route path=":reviewId" element={<EmploymentDetail />} />
    </Routes></div>
  </section>
}
function EmploymentListPage() {
  const { isLoggedIn, user } = useAuth()
  const [params, setParams] = useSearchParams()
  const outcome: EmploymentOutcome = params.get('outcome') === 'REJECTED' ? 'REJECTED' : 'ACCEPTED'
  const industry = params.get('industry') ?? ''
  const role = params.get('role') ?? ''
  const company = params.get('company') ?? ''
  const q = params.get('q') ?? ''
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isInteger(rawPage) && rawPage >= 0 && rawPage <= 10000 ? rawPage : 0
  const [revision, setRevision] = useState(0)
  const [search, setSearch] = useState(q)
  const options = useCtfResource(employmentApi.options, revision)
  const load = useCallback((signal: AbortSignal) => employmentApi.list({ outcome, industry, role, company, q, page }, signal), [outcome, industry, role, company, q, page])
  const resource = useCtfResource(load, revision + (user?.id ?? 0))
  const change = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); setParams(next) }
  return <>
    <ListingControls label="취업 후기 검색"
      search={<form className="employment-search-form" onSubmit={(event) => { event.preventDefault(); change('q', search.trim()) }}><SearchField value={search} onChange={setSearch} placeholder="회사명 · 제목으로 검색" /></form>}
      actions={<Link className="education-button is-primary" to={isLoggedIn ? `${root}/new` : '/login'}><Icon name="pencil-color" size={16} />후기 작성</Link>}
    >
      <SelectControl label="채용 결과" value={outcome} options={[{ value: 'ACCEPTED', label: '합격' }, { value: 'REJECTED', label: '불합격' }]} onChange={(value) => change('outcome', value)} />
      <SelectControl label="계열" value={industry} options={[{ value: '', label: '전체 계열' }, ...(options.data?.options.filter((item) => item.kind === 'INDUSTRY').map((item) => ({ value: item.id, label: item.label })) ?? [])]} onChange={(value) => change('industry', value)} />
      <SelectControl label="직무" value={role} options={[{ value: '', label: '전체 직무' }, ...(options.data?.options.filter((item) => item.kind === 'ROLE').map((item) => ({ value: item.id, label: item.label })) ?? [])]} onChange={(value) => change('role', value)} />
      <SelectControl label="회사" value={company} options={[{ value: '', label: '전체 회사' }, ...Array.from(new Set([...(options.data?.companies ?? []), ...(company ? [company] : [])])).map((name) => ({ value: name, label: name }))]} onChange={(value) => change('company', value)} />
    </ListingControls>
    <CtfResourceState loading={options.loading || resource.loading} error={resource.error ?? options.error} retry={() => setRevision((value) => value + 1)} />
    {resource.data && (resource.data.reviews.length ? <>
      <ul className="employment-review-list">{resource.data.reviews.map((review) => <li key={review.id}>
        <span className={`employment-outcome ${review.outcome.toLowerCase()}`}>{outcomeLabel(review.outcome)}</span>
        <div><Link to={`${root}/${review.id}`} className="employment-review-title">{review.title}</Link><div className="employment-review-meta"><strong>{review.company}</strong><span>{review.industry}</span><span>{review.role}</span><span>{review.recruitmentYear} · {stages[review.stage]}</span></div></div>
        <div className="employment-review-author"><span>{review.author}</span><time>{review.createdAt?.slice(0, 10)}</time></div>
      </li>)}</ul>
      <Pagination page={page + 1} pageCount={resource.data.totalPages} onChange={(value) => change('page', String(value - 1))} />
    </> : <EducationEmptyState image="/coala-mascot-plush.png" title="등록된 후기가 없습니다." />)}
  </>
}
function EmploymentDetail() {
  const { reviewId = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [revision, setRevision] = useState(0)
  const load = useCallback((signal: AbortSignal) => employmentApi.detail(reviewId, signal), [reviewId])
  const resource = useCtfResource(load, revision + (user?.id ?? 0))
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const review = resource.data
  const remove = async () => { if (!review || busy) return; setBusy(true); try { await employmentApi.delete(review.id); navigate(root) } catch (cause) { setError(featureError(cause)); setBusy(false) } }
  return <><Link className="employment-back" to={root}><Icon name="chevron-left" size={14} />후기 목록</Link><CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {error && <p role="alert" className="education-message">{error}</p>}
    {review && <article className="employment-detail"><header><span className={`employment-outcome ${review.outcome.toLowerCase()}`}>{outcomeLabel(review.outcome)}</span><h2>{review.title}</h2><p className="employment-review-meta">{review.author} · {review.createdAt?.slice(0, 10)}</p></header>
      <dl className="employment-facts">{[['회사', review.company], ['계열', review.industry], ['직무', review.role], ['채용 연도', review.recruitmentYear], ['전형', stages[review.stage]]].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
      <div className="employment-document" data-color-mode="light"><MDEditor.Markdown source={prepareMarkdownForDisplay(review.content)} skipHtml /></div>
      {review.canManage && <div className="employment-actions"><Link className="education-button" to={`${root}/${review.id}/editor`}><Icon name="edit" size={14} />수정</Link><button type="button" className="education-icon-button" title="삭제" aria-label="후기 삭제" onClick={() => setConfirm(true)}><Icon name="trash-color" size={16} /></button></div>}
      {confirm && <div className="employment-delete-confirm" role="alert"><p>이 후기를 삭제할까요?</p><button className="education-button" type="button" disabled={busy} onClick={() => void remove()}>삭제</button><button className="education-button" type="button" disabled={busy} onClick={() => setConfirm(false)}>취소</button></div>}
    </article>}
  </>
}
function EmploymentEditLoader() {
  const { reviewId = '' } = useParams()
  const [revision, setRevision] = useState(0)
  const load = useCallback((signal: AbortSignal) => employmentApi.detail(reviewId, signal), [reviewId])
  const resource = useCtfResource(load, revision)
  return <><CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />{resource.data && (resource.data.canManage ? <EmploymentEditor key={resource.data.id} initial={resource.data} /> : <EducationEmptyState title="수정 권한이 없습니다." />)}</>
}
function EmploymentEditor({ initial }: { initial?: EmploymentReview }) {
  const navigate = useNavigate()
  const [revision, setRevision] = useState(0)
  const options = useCtfResource(employmentApi.options, revision)
  const [form, setForm] = useState<EmploymentReviewInput>(() => initial ?? { company: '', industryId: '', roleId: '', outcome: 'ACCEPTED', stage: 'FINAL', recruitmentYear: new Date().getFullYear(), title: '', content: '', version: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const field = <K extends keyof EmploymentReviewInput>(key: K, value: EmploymentReviewInput[K]) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => { event.preventDefault(); if (busy) return; setBusy(true); setError(null); try { const saved = await employmentApi.save(form, initial?.id); navigate(`${root}/${saved.id}`) } catch (cause) { setError(featureError(cause)); setBusy(false) } }
  return <><Link className="employment-back" to={root}><Icon name="chevron-left" size={14} />후기 목록</Link><h2 className="employment-editor-title">{initial ? '후기 수정' : '취업 후기 작성'}</h2>
    <CtfResourceState {...options} retry={() => setRevision((value) => value + 1)} />
    {error && <p className="education-message" role="alert">{error}</p>}
    {options.data && <form className="employment-form" onSubmit={submit}><fieldset disabled={busy}>
      <div className="employment-form-grid">
        <label>회사<input type="text" value={form.company} onChange={(event) => field('company', event.target.value)} list="employment-companies" required maxLength={120} autoComplete="organization" /></label>
        <datalist id="employment-companies">{options.data.companies.map((company) => <option key={company} value={company} />)}</datalist>
        {(['INDUSTRY', 'ROLE'] as const).map((kind) => { const key = kind === 'INDUSTRY' ? 'industryId' : 'roleId'; const current = initial && !options.data!.options.some((item) => item.id === form[key]); return <label key={kind}>{kind === 'INDUSTRY' ? '계열' : '직무'}<select value={form[key]} onChange={(event) => field(key, event.target.value)} required><option value="">선택</option>{current && <option value={initial[key]}>{kind === 'INDUSTRY' ? initial.industry : initial.role}</option>}{options.data!.options.filter((item) => item.kind === kind).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label> })}
        <label>결과<select value={form.outcome} onChange={(event) => field('outcome', event.target.value as EmploymentOutcome)}><option value="ACCEPTED">합격</option><option value="REJECTED">불합격</option></select></label>
        <label>전형<select value={form.stage} onChange={(event) => field('stage', event.target.value)}>{Object.entries(stages).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>채용 연도<input type="number" min={2000} max={2100} required value={form.recruitmentYear} onChange={(event) => field('recruitmentYear', Number(event.target.value))} /></label>
      </div>
      <label>제목<input required maxLength={150} value={form.title} onChange={(event) => field('title', event.target.value)} /></label>
      <label>후기<textarea required rows={16} maxLength={30000} value={form.content} onChange={(event) => field('content', event.target.value)} /></label>
      <div className="employment-actions"><Link className="education-button" to={initial ? `${root}/${initial.id}` : root}>취소</Link><button className="education-button is-primary" disabled={busy}><Icon name="edit" size={14} />{busy ? '저장 중...' : '저장'}</button></div>
    </fieldset></form>}
  </>
}
