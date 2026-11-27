import { AdminSearch } from './AdminSearch'
import { AdminDetail } from './AdminDetail'
import { useState, type FormEvent } from 'react'
import { adminApi, type AdminServicePayload } from '../../shared/api/admin'
import type { MemberService } from '../../shared/api/services'
import { Icon } from '../../shared/ui/Icon'
import { AdminField as Field } from './AdminFields'
import { isHttpUrl, isImageUrl } from './adminValidation'
import { attachmentsApi } from '../../shared/api/attachments'

function serviceDraft(service?: MemberService): AdminServicePayload {
  return {
    title: service?.title ?? '', category: service?.category ?? 'productivity', owner: service?.owner ?? '', summary: service?.summary ?? '',
    url: service?.url ?? '', githubUrl: service?.githubUrl ?? '', imageUrl: service?.imageUrl ?? '', additionalImageUrls: service?.additionalImageUrls ?? [], tags: service?.tags ?? [],
    status: service?.status === '운영중지' ? '운영중지' : ['운영완료', '운영종료'].includes(service?.status ?? '') ? '운영완료' : '운영중',
    audience: service?.audience ?? '코알라 부원', description: service?.description ?? '', features: service?.features ?? [], stack: service?.stack ?? [],
  }
}

export function AdminServicesPanel({ services, onChange }: { services: MemberService[]; onChange: (services: MemberService[]) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [feedback, setFeedback] = useState('')
  const selected = services.find((service) => service.id === selectedId)
  const filtered = services.filter((service) => (status === 'all' || serviceDraft(service).status === status) && `${service.title} ${service.owner}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <div className="admin-two-column">
    <section className="admin-panel"><div className="admin-panel-header"><h3>회원 서비스</h3><button type="button" className="admin-ghost-button" disabled={busy} onClick={() => { setSelectedId(null); setGeneration((value) => value + 1); setFeedback(''); setEditorOpen(true) }}><Icon name="plus" size={15} />서비스 추가</button></div>
      {feedback && <p role="status" className="admin-feedback">{feedback}</p>}
      <AdminSearch><label className="admin-member-search"><Icon name="search" size={16} /><input aria-label="서비스 검색" placeholder="서비스 이름, 운영자 검색" value={query} onChange={(e) => setQuery(e.target.value)} /></label></AdminSearch>
      <select className="admin-inline-select" aria-label="서비스 상태" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">전체 상태</option>{['운영중', '운영중지', '운영완료'].map((value) => <option key={value}>{value}</option>)}</select>
      <div className="admin-list">{filtered.map((service) => <button type="button" key={service.id} className={`admin-list-row${selectedId === service.id ? ' is-active' : ''}`} disabled={busy} aria-pressed={selectedId === service.id} onClick={() => { setSelectedId(service.id); setEditorOpen(true) }}><span>{service.title}</span><small>{service.category} · {service.owner}</small><b>{service.status}</b></button>)}{!filtered.length && <p className="admin-empty">조건에 맞는 서비스가 없습니다.</p>}</div>
    </section>
    {editorOpen && <AdminDetail key={`${selectedId ?? 'new'}-${generation}`} busy={busy} onClose={() => { setEditorOpen(false); setSelectedId(null) }}><ServiceEditor key={selected?.id ?? 'new'} service={selected} onBusy={setBusy} onSave={(saved) => { onChange(services.some((item) => item.id === saved.id) ? services.map((item) => item.id === saved.id ? saved : item) : [...services, saved]); setSelectedId(saved.id); setFeedback('서비스를 저장했습니다.') }} /></AdminDetail>}
  </div>
}

function ServiceEditor({ service, onSave, onBusy }: { service?: MemberService; onSave: (saved: MemberService) => void; onBusy: (value: boolean) => void }) {
  const [draft, setDraft] = useState(() => serviceDraft(service))
  const [tags, setTags] = useState(service?.tags.join(', ') ?? '')
  const [images, setImages] = useState(service?.additionalImageUrls?.join('\n') ?? '')
  const [features, setFeatures] = useState(service?.features.join('\n') ?? '')
  const [stack, setStack] = useState(service?.stack.join(', ') ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const tagList = tags.split(',').map((item) => item.trim()).filter(Boolean)
  const imageList = images.split('\n').map((item) => item.trim()).filter(Boolean)
  const featureList = features.split('\n').map((item) => item.trim()).filter(Boolean)
  const stackList = stack.split(',').map((item) => item.trim()).filter(Boolean)
  const valid = draft.title.trim() && draft.category.trim() && draft.summary.trim() && isHttpUrl(draft.url.trim()) && (!draft.githubUrl || isHttpUrl(draft.githubUrl.trim())) &&
    isImageUrl(draft.imageUrl?.trim() ?? '') && tagList.length > 0 && tagList.every((tag) => tag.length <= 50) && imageList.length <= 5 && imageList.every((url) => url.length <= 500 && isImageUrl(url)) && featureList.length <= 30 && featureList.every((value) => value.length <= 255) && stackList.length <= 30 && stackList.every((value) => value.length <= 80)
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!valid || saving) return
    setSaving(true); onBusy(true); setMessage('')
    const payload: AdminServicePayload = { ...draft, title: draft.title.trim(), category: draft.category.trim(), owner: draft.owner.trim(), summary: draft.summary.trim(), url: draft.url.trim(), githubUrl: draft.githubUrl?.trim(), imageUrl: draft.imageUrl?.trim(), tags: tagList, additionalImageUrls: imageList, audience: draft.audience?.trim(), description: draft.description?.trim(), features: featureList, stack: stackList }
    try {
      const saved = service ? await adminApi.updateMemberService(service.id, payload) : await adminApi.createMemberService(payload)
      setDraft(serviceDraft(saved)); setTags(saved.tags.join(', ')); setImages(saved.additionalImageUrls?.join('\n') ?? ''); setFeatures(saved.features.join('\n')); setStack(saved.stack.join(', ')); onSave(saved)
    } catch { setMessage('서비스 저장에 실패했습니다. 입력 내용은 유지됩니다.') }
    finally { setSaving(false); onBusy(false) }
  }
  async function upload(files: File[], additional: boolean) {
    if (saving || files.length === 0) return
    if (files.some((file) => !/^image\/(png|jpeg|webp|gif)$/.test(file.type))) { setMessage('PNG, JPG, WebP, GIF 이미지를 선택하세요.'); return }
    if (files.some((file) => file.size > 10485760)) { setMessage('이미지는 파일당 10MB까지 업로드할 수 있습니다.'); return }
    if (additional && imageList.length + files.length > 5) { setMessage('추가 이미지는 최대 5개입니다.'); return }
    setSaving(true); onBusy(true); setMessage('')
    try {
      for (const file of additional ? files : files.slice(0, 1)) {
        const uploaded = await attachmentsApi.uploadImage(file)
        if (additional) setImages((current) => [current, uploaded.url].filter(Boolean).join('\n'))
        else setDraft((current) => ({ ...current, imageUrl: uploaded.url }))
      }
      setMessage('이미지를 연결했습니다.')
    } catch { setMessage('이미지 업로드에 실패했습니다. 입력 내용은 유지됩니다.') }
    finally { setSaving(false); onBusy(false) }
  }
  return <form className="admin-panel admin-form" onSubmit={(event) => void save(event)}>
    <div className="admin-panel-header"><h3>{service ? '서비스 수정' : '서비스 추가'}</h3></div>
    <fieldset className="admin-fieldset" disabled={saving}>
      <Field label="서비스 이름"><input required maxLength={100} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
      <div className="admin-field-row"><Field label="카테고리"><input required maxLength={50} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></Field>
        <Field label="운영 상태"><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as AdminServicePayload['status'] })}>{['운영중', '운영중지', '운영완료'].map((value) => <option key={value}>{value}</option>)}</select></Field></div>
      <Field label="운영자 표시명"><input maxLength={50} value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} /></Field>
      <Field label="요약"><textarea required rows={4} maxLength={255} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></Field>
      <Field label="이용 대상"><input maxLength={100} value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })} /></Field>
      <Field label="상세 설명"><textarea rows={8} maxLength={20000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
      <Field label="주요 기능"><textarea rows={4} value={features} onChange={(e) => setFeatures(e.target.value)} /></Field>
      <Field label="기술 스택"><input value={stack} onChange={(e) => setStack(e.target.value)} /></Field>
      <Field label="서비스 URL"><input required type="url" maxLength={500} value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} /></Field>
      <Field label="GitHub URL"><input type="url" maxLength={500} value={draft.githubUrl} onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })} /></Field>
      <Field label="대표 이미지 URL"><input maxLength={500} value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></Field>
      <label className="admin-file-command"><Icon name="image" size={15} />대표 이미지 업로드<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="서비스 대표 이미지 파일" onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; void upload(files, false) }} /></label>
      <Field label="추가 이미지 URL (줄바꿈 구분, 최대 5개)"><textarea rows={3} value={images} onChange={(e) => setImages(e.target.value)} /></Field>
      <label className="admin-file-command"><Icon name="plus" size={15} />추가 이미지 업로드<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" aria-label="서비스 추가 이미지 파일" onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; void upload(files, true) }} /></label>
      <Field label="태그 (쉼표 구분)"><input required value={tags} onChange={(e) => setTags(e.target.value)} /></Field>
      {imageList.length > 5 && <p className="admin-error">추가 이미지는 최대 5개입니다.</p>}
      {tagList.some((tag) => tag.length > 50) && <p className="admin-error">태그는 각각 50자 이내로 입력하세요.</p>}
      {(featureList.length > 30 || featureList.some((value) => value.length > 255) || stackList.length > 30 || stackList.some((value) => value.length > 80)) && <p className="admin-error">기능은 항목당 255자, 기술 스택은 80자 이내로 각각 최대 30개까지 등록할 수 있습니다.</p>}
      {((draft.url && !isHttpUrl(draft.url.trim())) || (draft.githubUrl && !isHttpUrl(draft.githubUrl.trim())) || !isImageUrl(draft.imageUrl?.trim() ?? '') || imageList.some((url) => !isImageUrl(url) || url.length > 500)) && <p className="admin-error">URL을 확인하세요. 서비스 주소는 HTTP(S), 이미지는 HTTP(S) 또는 사이트 내부 경로로 입력하세요.</p>}
      <div className="admin-service-save-actions"><button type="submit" className="admin-primary-button" disabled={!valid}>{saving ? '저장 중...' : '서비스 저장'}</button></div>
    </fieldset><p className="admin-feedback" role="status">{message}</p>
  </form>
}
