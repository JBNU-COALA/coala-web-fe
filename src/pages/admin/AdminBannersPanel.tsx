import { useState, type FormEvent } from 'react'
import { adminApi } from '../../shared/api/admin'
import type { SiteBanner, SiteBannerPayload } from '../../shared/api/site'
import { Icon } from '../../shared/ui/Icon'
import { AdminField as Field, AdminLoadState } from './AdminFields'
import { isImageUrl, isInternalPath } from './adminValidation'
import { useAdminResource } from './useAdminResource'

const emptyBanner: SiteBannerPayload = { title: '', eyebrow: '', description: '', imageUrl: '', targetPath: '/', actionLabel: '자세히 보기', tone: 'green', sortOrder: 0, enabled: false }
const tones = { green: '초록', blue: '파랑', coral: '코랄' } as const

export function AdminBannersPanel({ refreshKey }: { refreshKey: number }) {
  const resource = useAdminResource(adminApi.getBanners, refreshKey)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  if (resource.loading || resource.error || !resource.data) return <AdminLoadState {...resource} onRetry={resource.reload} />
  const banners = [...resource.data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
  const selected = banners.find((item) => item.id === selectedId)
  return <div className="admin-two-column">
    <section className="admin-panel">
      <div className="admin-panel-header"><h3>홈 배너 <small>{banners.length}</small></h3>
        <button type="button" className="admin-ghost-button" disabled={busy} onClick={() => setSelectedId(null)}><Icon name="plus" size={15} />배너 추가</button></div>
      <div className="admin-list">{banners.map((banner) => <button type="button" key={banner.id} disabled={busy} aria-pressed={selectedId === banner.id}
        className={`admin-list-row${selectedId === banner.id ? ' is-active' : ''}`} onClick={() => setSelectedId(banner.id)}>
        <span>{banner.title}</span><small>순서 {banner.sortOrder} · {banner.targetPath}</small><b>{banner.enabled ? '공개' : '비공개'}</b>
      </button>)}{!banners.length && <p className="admin-empty">등록된 배너가 없습니다.</p>}</div>
    </section>
    <BannerEditor key={selected?.id ?? 'new'} banner={selected} onBusy={setBusy} onSave={(saved) => {
      resource.setData((items) => items?.some((item) => item.id === saved.id) ? items.map((item) => item.id === saved.id ? saved : item) : [...(items ?? []), saved])
      setSelectedId(saved.id)
    }} onDelete={(id) => { resource.setData((items) => items?.filter((item) => item.id !== id) ?? []); setSelectedId(null) }} />
  </div>
}

function BannerEditor({ banner, onSave, onDelete, onBusy }: {
  banner?: SiteBanner; onSave: (saved: SiteBanner) => void; onDelete: (id: number) => void; onBusy: (value: boolean) => void
}) {
  const [draft, setDraft] = useState<SiteBannerPayload>(() => banner ? {
    title: banner.title, eyebrow: banner.eyebrow, description: banner.description, imageUrl: banner.imageUrl,
    targetPath: banner.targetPath, actionLabel: banner.actionLabel, tone: banner.tone, sortOrder: banner.sortOrder, enabled: banner.enabled,
  } : emptyBanner)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const validPath = isInternalPath(draft.targetPath.trim())
  const validImage = isImageUrl(draft.imageUrl.trim())
  const valid = draft.title.trim() && draft.actionLabel.trim() && validPath && validImage && Number.isSafeInteger(draft.sortOrder) && draft.sortOrder >= 0 && draft.sortOrder <= 2147483647
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!valid || saving) return
    setSaving(true); onBusy(true); setMessage('')
    const payload = { ...draft, title: draft.title.trim(), eyebrow: draft.eyebrow.trim(), description: draft.description.trim(), imageUrl: draft.imageUrl.trim(), targetPath: draft.targetPath.trim(), actionLabel: draft.actionLabel.trim() }
    try {
      const saved = banner ? await adminApi.updateBanner(banner.id, payload) : await adminApi.createBanner(payload)
      setDraft(payload); setMessage('배너를 저장했습니다.'); onSave(saved)
    } catch { setMessage('배너 저장에 실패했습니다. 입력 내용은 유지됩니다.') }
    finally { setSaving(false); onBusy(false) }
  }
  async function remove() {
    if (!banner || saving || !window.confirm(`"${banner.title}" 배너를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return
    setSaving(true); onBusy(true)
    try { await adminApi.deleteBanner(banner.id); onDelete(banner.id) }
    catch { setMessage('배너를 삭제하지 못했습니다.') }
    finally { setSaving(false); onBusy(false) }
  }
  return <div className="admin-stack">
    <form className="admin-panel admin-form" onSubmit={(event) => void save(event)}>
      <div className="admin-panel-header"><h3>{banner ? '배너 수정' : '배너 추가'}</h3>{banner && <button type="button" className="admin-danger-button" disabled={saving} onClick={() => void remove()}>삭제</button>}</div>
      <fieldset className="admin-fieldset" disabled={saving}>
        <Field label="제목"><input required maxLength={150} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
        <Field label="상단 문구"><input maxLength={80} value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} /></Field>
        <Field label="설명"><textarea rows={3} maxLength={2000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
        <Field label="이미지 URL"><input maxLength={2000} value={draft.imageUrl} placeholder="https:// 또는 /images/..." onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></Field>
        {!validImage && <p className="admin-error">이미지는 HTTP(S) 주소 또는 사이트 내부 경로를 입력하세요.</p>}
        <Field label="이동 경로"><input required maxLength={500} value={draft.targetPath} placeholder="/community/activity" onChange={(e) => setDraft({ ...draft, targetPath: e.target.value })} /></Field>
        {!validPath && <p className="admin-error">이동 경로는 /로 시작하는 사이트 내부 주소여야 합니다.</p>}
        <div className="admin-field-row">
          <Field label="버튼 문구"><input required maxLength={40} value={draft.actionLabel} onChange={(e) => setDraft({ ...draft, actionLabel: e.target.value })} /></Field>
          <Field label="노출 순서"><input required type="number" min={0} max={2147483647} step={1} value={Number.isNaN(draft.sortOrder) ? '' : draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value === '' ? Number.NaN : Number(e.target.value) })} /></Field>
        </div>
        <div className="admin-field"><span>색상</span><div className="admin-tone-options" role="group" aria-label="배너 색상">
          {Object.entries(tones).map(([tone, label]) => <button type="button" key={tone} title={label} aria-label={label} aria-pressed={draft.tone === tone} className={`admin-tone admin-tone--${tone}`} onClick={() => setDraft({ ...draft, tone: tone as SiteBanner['tone'] })} />)}
        </div></div>
        <label className="admin-toggle"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />홈에 공개</label>
        <button type="submit" className="admin-primary-button" disabled={!valid}><Icon name="edit" size={15} />{saving ? '저장 중...' : '배너 저장'}</button>
      </fieldset>
      <p className="admin-feedback" role="status">{message}</p>
    </form>
    <section className={`admin-banner-preview admin-banner-preview--${draft.tone}`} aria-label="배너 미리보기">
      {draft.imageUrl && validImage && <BannerImage key={draft.imageUrl} url={draft.imageUrl.trim()} />}
      <div><small>{draft.eyebrow}</small><h3>{draft.title || '배너 제목'}</h3><p>{draft.description}</p><span>{draft.actionLabel} <Icon name="chevron-right" size={14} /></span></div>
    </section>
  </div>
}

function BannerImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? <p className="admin-empty">이미지를 불러오지 못했습니다.</p> : <img src={url} alt="배너 이미지" onError={() => setFailed(true)} />
}
