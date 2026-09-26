import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { siteApi, type SiteAboutContent } from '../../shared/api/site'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { AdminField as Field, AdminLoadState } from './AdminFields'
import { useAdminResource } from './useAdminResource'

export function AdminAboutPanel({ refreshKey }: { refreshKey: number }) {
  const resource = useAdminResource(siteApi.getAbout, refreshKey)
  if (resource.loading || resource.error || !resource.data) return <AdminLoadState {...resource} onRetry={resource.reload} />
  return <AboutEditor content={resource.data} />
}

function AboutEditor({ content }: { content: SiteAboutContent }) {
  const [draft, setDraft] = useState(content)
  const [chips, setChips] = useState(content.chips.join(', '))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const keywords = chips.split(',').map((chip) => chip.trim()).filter(Boolean)
  const valid = draft.title.trim() && draft.description.trim() && keywords.every((chip) => chip.length <= 30)
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    setMessage('')
    try {
      const saved = await siteApi.updateAbout({ title: draft.title.trim(), description: draft.description.trim(), chips: keywords })
      setDraft(saved)
      setChips(saved.chips.join(', '))
      setMessage('소개를 저장했습니다.')
    } catch { setMessage('소개 저장에 실패했습니다. 입력 내용은 유지됩니다.') }
    finally { setSaving(false) }
  }
  return <div className="admin-two-column">
    <form className="admin-panel admin-form" onSubmit={(event) => void save(event)}>
      <div className="admin-panel-header"><h3>동아리 소개</h3><Link className="admin-text-link" to={routes.about}>소개 페이지 <Icon name="chevron-right" size={14} /></Link></div>
      <fieldset className="admin-fieldset" disabled={saving}>
        <Field label="제목"><input required maxLength={150} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
        <Field label="소개 문구"><textarea required maxLength={2000} rows={8} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
        <Field label="키워드 (쉼표 구분)"><input value={chips} onChange={(e) => setChips(e.target.value)} /></Field>
        {keywords.some((chip) => chip.length > 30) && <p className="admin-error" role="alert">키워드는 각각 30자 이내로 입력하세요.</p>}
        <button className="admin-primary-button" disabled={!valid} type="submit"><Icon name="edit" size={15} />{saving ? '저장 중...' : '소개 저장'}</button>
      </fieldset>
      <p className="admin-feedback" role="status">{message}</p>
    </form>
    <section className="admin-panel admin-about-preview" aria-label="소개 미리보기">
      <p className="admin-kicker">COALA</p><h3>{draft.title}</h3><p>{draft.description}</p>
      <div className="admin-about-chips">{keywords.map((chip, index) => <span key={index}>{chip}</span>)}</div>
    </section>
  </div>
}
