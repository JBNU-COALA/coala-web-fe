import { useState, type FormEvent } from 'react'
import { adminApi } from '../../shared/api/admin'
import type { SiteBanner, SiteBannerPayload } from '../../shared/api/site'
import { Icon } from '../../shared/ui/Icon'
import { AdminField as Field, AdminLoadState } from './AdminFields'
import { isImageUrl, isInternalPath } from './adminValidation'
import { useAdminResource } from './useAdminResource'
import { attachmentsApi } from '../../shared/api/attachments'
import { useAdminEditorFocus } from './useAdminEditorFocus'
import { resolveApiAssetUrl } from '../../shared/api/client'

const emptyBanner: SiteBannerPayload = { title: '', eyebrow: '', description: '', imageUrl: '', targetPath: '/', actionLabel: '자세히 보기', tone: 'green', sortOrder: 0, enabled: false }
const tones = { green: '초록', blue: '파랑', coral: '코랄' } as const

export function AdminBannersPanel({ refreshKey }: { refreshKey: number }) {
  const resource = useAdminResource(adminApi.getBanners, refreshKey)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [feedback, setFeedback] = useState('')
  if (resource.loading || resource.error || !resource.data) return <AdminLoadState {...resource} onRetry={resource.reload} />
  const banners = [...resource.data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
  const selected = banners.find((item) => item.id === selectedId)
  return <div className={`admin-two-column admin-master-detail${editorOpen ? ' has-selection' : ''}`}>
    <section className="admin-panel">
      <div className="admin-panel-header"><h3>홈 배너</h3>
        <div className="admin-row-actions"><BannerHelp /><button type="button" className="admin-ghost-button" disabled={busy} onClick={() => { setSelectedId(null); setGeneration((value) => value + 1); setFeedback(''); setEditorOpen(true) }}><Icon name="plus" size={15} />배너 추가</button></div></div>
      {feedback && <p role="status" className="admin-feedback">{feedback}</p>}
      <div className="admin-list">{banners.map((banner) => <button type="button" key={banner.id} disabled={busy} aria-pressed={selectedId === banner.id}
        className={`admin-list-row${selectedId === banner.id ? ' is-active' : ''}`} onClick={() => { setSelectedId(banner.id); setFeedback(''); setEditorOpen(true) }}>
        <span>{banner.title}</span><small>순서 {banner.sortOrder} · {banner.targetPath}</small><b>{banner.enabled ? '공개' : '비공개'}</b>
      </button>)}{!banners.length && <p className="admin-empty">등록된 배너가 없습니다.</p>}</div>
    </section>
    <div className={`admin-banner-collapse${editorOpen ? ' is-open' : ''}`} inert={!editorOpen}><div>
    <BannerEditor key={`${selected?.id ?? 'new'}-${generation}`} active={editorOpen} banner={selected} onBusy={setBusy} onClose={() => { setEditorOpen(false); setSelectedId(null) }} onSave={(saved) => {
      resource.setData((items) => items?.some((item) => item.id === saved.id) ? items.map((item) => item.id === saved.id ? saved : item) : [...(items ?? []), saved])
      setSelectedId(saved.id)
      setFeedback('배너를 저장했습니다.')
    }} onDelete={(id) => { resource.setData((items) => items?.filter((item) => item.id !== id) ?? []); setSelectedId(null); setEditorOpen(false); setFeedback('배너를 삭제했습니다.') }} />
    </div></div>
  </div>
}

function BannerEditor({ banner, active, onSave, onDelete, onBusy, onClose }: {
  banner?: SiteBanner; active: boolean; onSave: (saved: SiteBanner) => void; onDelete: (id: number) => void; onBusy: (value: boolean) => void; onClose: () => void
}) {
  const [draft, setDraft] = useState<SiteBannerPayload>(() => banner ? {
    title: banner.title, eyebrow: banner.eyebrow, description: banner.description, imageUrl: banner.imageUrl,
    targetPath: banner.targetPath, actionLabel: banner.actionLabel, tone: banner.tone, sortOrder: banner.sortOrder, enabled: banner.enabled,
  } : emptyBanner)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'template' | 'image'>(() => banner?.imageUrl ? 'image' : 'template')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const editorRef = useAdminEditorFocus(active ? banner?.id ?? 'new' : null)
  const validPath = isInternalPath(draft.targetPath.trim())
  const validImage = isImageUrl(draft.imageUrl.trim())
  const valid = (mode === 'image' ? Boolean(draft.imageUrl.trim()) && validImage : Boolean(draft.title.trim() && draft.actionLabel.trim())) && validPath && Number.isSafeInteger(draft.sortOrder) && draft.sortOrder >= 0 && draft.sortOrder <= 2147483647
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!valid || saving || uploading) return
    setSaving(true); onBusy(true); setMessage('')
    const payload = { ...draft, title: draft.title.trim() || '이미지 배너', eyebrow: mode === 'image' ? '' : draft.eyebrow.trim(), description: mode === 'image' ? '' : draft.description.trim(), imageUrl: mode === 'image' ? draft.imageUrl.trim() : '', targetPath: draft.targetPath.trim(), actionLabel: mode === 'image' ? '배너 보기' : draft.actionLabel.trim() }
    try {
      const saved = banner ? await adminApi.updateBanner(banner.id, payload) : await adminApi.createBanner(payload)
      setDraft(payload); onSave(saved)
    } catch { setMessage('배너 저장에 실패했습니다. 입력 내용은 유지됩니다.') }
    finally { setSaving(false); onBusy(false) }
  }
  async function upload(file: File) {
    if (saving || uploading) return
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { setMessage('PNG, JPG, WebP, GIF 이미지를 선택하세요.'); return }
    if (file.size > 10485760) { setMessage('이미지는 파일당 10MB까지 업로드할 수 있습니다.'); return }
    setUploading(true); onBusy(true); setMessage('')
    try { const uploaded = await attachmentsApi.uploadImage(file); setDraft((current) => ({ ...current, imageUrl: uploaded.url })); setMessage('이미지를 연결했습니다.') }
    catch { setMessage('이미지 업로드에 실패했습니다. 기존 이미지는 유지됩니다.') }
    finally { setUploading(false); onBusy(false) }
  }
  async function remove() {
    if (!banner || saving || uploading || !window.confirm(`"${banner.title}" 배너를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return
    setSaving(true); onBusy(true)
    try { await adminApi.deleteBanner(banner.id); onDelete(banner.id) }
    catch { setMessage('배너를 삭제하지 못했습니다.') }
    finally { setSaving(false); onBusy(false) }
  }
  return <section ref={editorRef} className="admin-stack admin-editor-enter admin-banner-editor">
    <form className="admin-panel admin-form" onSubmit={(event) => void save(event)}>
      <div className="admin-panel-header"><h3>{banner ? '배너 수정' : '배너 추가'}</h3>{banner && <button type="button" className="admin-danger-button" disabled={saving || uploading} onClick={() => void remove()} aria-label="삭제" title="삭제"><Icon name="trash-color" size={18} /></button>}</div>
      <fieldset className="admin-fieldset" disabled={saving || uploading}>
        <div className="admin-field"><span>배너 방식</span><div className="admin-row-actions" role="group" aria-label="배너 방식">
          <button type="button" className={mode === 'template' ? 'admin-primary-button' : 'admin-ghost-button'} aria-pressed={mode === 'template'} onClick={() => setMode('template')}><Icon name="pencil-color" size={15} />템플릿에 글 작성</button>
          <button type="button" className={mode === 'image' ? 'admin-primary-button' : 'admin-ghost-button'} aria-pressed={mode === 'image'} onClick={() => setMode('image')}><Icon name="image" size={15} />이미지만 사용</button>
        </div></div>
        {mode === 'template' && <>
        <Field label="제목"><input required maxLength={150} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
        <Field label="상단 문구"><input maxLength={80} value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} /></Field>
        <Field label="설명"><textarea rows={3} maxLength={2000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
        </>}
        {mode === 'image' && <>
        <p className="admin-hint">직접 만든 배너 이미지만 표시합니다. 제목·설명·버튼 문구는 입력하지 않아도 됩니다.</p>
        <Field label="이미지 URL"><input maxLength={2000} value={draft.imageUrl} placeholder="https:// 또는 /images/..." onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></Field>
        <div className="admin-row-actions"><label className="admin-file-command"><Icon name="image" size={15} />이미지 업로드<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="배너 이미지 파일" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file) }} /></label>{draft.imageUrl && <button type="button" className="admin-icon-button" aria-label="배너 이미지 제거" title="이미지 제거" onClick={() => { setDraft({ ...draft, imageUrl: '' }); setMode('template') }}><Icon name="close" size={15} /></button>}</div>
        <p className="admin-hint">JPG, PNG, WebP, GIF · 최대 10MB · 가로형 2400×800 권장</p>
        {uploading && <p role="status">이미지 업로드 중...</p>}
        {!validImage && <p className="admin-error">이미지는 HTTP(S) 주소 또는 사이트 내부 경로를 입력하세요.</p>}
        </>}
        <Field label="이동 경로"><input required maxLength={500} value={draft.targetPath} placeholder="/community/activity" onChange={(e) => setDraft({ ...draft, targetPath: e.target.value })} /></Field>
        {!validPath && <p className="admin-error">이동 경로는 /로 시작하는 사이트 내부 주소여야 합니다.</p>}
        <div className="admin-field-row">
          {mode === 'template' && <Field label="버튼 문구"><input required maxLength={40} value={draft.actionLabel} onChange={(e) => setDraft({ ...draft, actionLabel: e.target.value })} /></Field>}
          <Field label="노출 순서"><input required type="number" min={0} max={2147483647} step={1} value={Number.isNaN(draft.sortOrder) ? '' : draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value === '' ? Number.NaN : Number(e.target.value) })} /></Field>
        </div>
        {mode === 'template' && <div className="admin-field"><span>색상</span><div className="admin-tone-options" role="group" aria-label="배너 색상">
          {Object.entries(tones).map(([tone, label]) => <button type="button" key={tone} title={label} aria-label={label} aria-pressed={draft.tone === tone} className={`admin-tone admin-tone--${tone}`} onClick={() => setDraft({ ...draft, tone: tone as SiteBanner['tone'] })} />)}
        </div></div>}
        <label className="admin-toggle"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />홈에 공개</label>
        <div className="admin-row-actions"><button type="button" className="admin-ghost-button" onClick={onClose}>닫기</button><button type="submit" className="admin-primary-button" disabled={!valid}><Icon name="edit" size={15} />{saving ? '저장 중...' : '배너 저장'}</button></div>
      </fieldset>
      <p className="admin-feedback" role="status">{message}</p>
    </form>
    <section className={`admin-banner-preview admin-banner-preview--${draft.tone}`} aria-label="배너 미리보기">
      {mode === 'image' && draft.imageUrl && validImage && <BannerImage key={draft.imageUrl} url={draft.imageUrl.trim()} />}
      {mode === 'image' && !draft.imageUrl && <p className="admin-empty">배너 이미지를 업로드해주세요.</p>}
      {mode === 'template' && <div><small>{draft.eyebrow}</small><h3>{draft.title || '배너 제목'}</h3><p>{draft.description}</p><span>{draft.actionLabel} <Icon name="chevron-right" size={14} /></span></div>}
    </section>
  </section>
}

function BannerHelp() {
  const [open, setOpen] = useState(false)
  return <div className="admin-banner-help" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
    <button type="button" className="admin-help-button" aria-label="배너 작성 도움말" aria-expanded={open} aria-controls="admin-banner-help" onClick={() => setOpen(value => !value)}><Icon name="help-circle" size={17} /></button>
    <div id="admin-banner-help" className={`admin-help-popover${open ? ' is-open' : ''}`} role="note" aria-hidden={!open}>
      이미지를 넣으면 홈 배너가 이미지로만 채워집니다. 문구를 이미지에 포함하고 2400×800(약 3:1) 비율을 권장합니다. 비워 두면 제목·설명·버튼이 배너에 표시됩니다.
    </div>
  </div>
}

function BannerImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? <p className="admin-empty">이미지를 불러오지 못했습니다.</p> : <img src={resolveApiAssetUrl(url)} alt="배너 이미지" onError={() => setFailed(true)} />
}
