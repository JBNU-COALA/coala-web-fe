import { useEffect, useState, type FormEvent } from 'react'
import { CommunityBanner } from '../community/CommunityBanner'
import { siteApi, type SiteAboutContent } from '../../shared/api/site'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { useAuth } from '../../shared/auth/AuthContext'
import { Icon } from '../../shared/ui/Icon'

const defaultAboutContent: SiteAboutContent = {
  title: '함께 만들고 운영하는 개발 동아리',
  description: '코알라는 프로젝트, 스터디, 서비스 운영을 통해 개발 경험을 쌓는 전북대학교 개발 동아리입니다.',
  chips: ['프로젝트', '스터디', '서비스 운영', '커뮤니티'],
}

function toDraft(content: SiteAboutContent) {
  return {
    title: content.title,
    description: content.description,
    chipsText: content.chips.join(', '),
  }
}

export function AboutPage() {
  const { user } = useAuth()
  const canEdit = isAdminUser(user)
  const [content, setContent] = useState<SiteAboutContent>(defaultAboutContent)
  const [draft, setDraft] = useState(() => toDraft(defaultAboutContent))
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    siteApi.getAbout()
      .then((nextContent) => {
        setContent(nextContent)
        setDraft(toDraft(nextContent))
      })
      .catch(() => setContent(defaultAboutContent))
  }, [])

  const saveAbout = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.description.trim()) return
    try {
      const saved = await siteApi.updateAbout({
        title: draft.title.trim(),
        description: draft.description.trim(),
        chips: draft.chipsText.split(',').map((chip) => chip.trim()).filter(Boolean),
      })
      setContent(saved)
      setDraft(toDraft(saved))
      setIsEditing(false)
      setMessage('소개 페이지를 저장했습니다.')
    } catch {
      setMessage('소개 페이지 저장에 실패했습니다.')
    }
  }

  return (
    <section className="coala-content coala-content--about">
      <div className="about-page">
        <CommunityBanner title="동아리 소개" tone="about" />

        <section className="surface-card about-intro">
          <div className="about-intro-head">
            <p className="about-intro-eyebrow">COALA</p>
            {canEdit ? (
              <button
                type="button"
                className="about-edit-button"
                onClick={() => {
                  setDraft(toDraft(content))
                  setIsEditing((current) => !current)
                }}
              >
                <Icon name="edit" size={14} />
                수정
              </button>
            ) : null}
          </div>
          {isEditing ? (
            <form className="about-edit-form" onSubmit={saveAbout}>
              <label className="jcloud-field">
                <span className="jcloud-label">제목</span>
                <input
                  className="jcloud-input"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                />
              </label>
              <label className="jcloud-field">
                <span className="jcloud-label">소개</span>
                <textarea
                  className="jcloud-textarea"
                  rows={4}
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label className="jcloud-field">
                <span className="jcloud-label">키워드</span>
                <input
                  className="jcloud-input"
                  value={draft.chipsText}
                  onChange={(event) => setDraft((current) => ({ ...current, chipsText: event.target.value }))}
                />
              </label>
              <div className="about-edit-actions">
                <button type="submit" className="jcloud-submit-button">저장</button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setDraft(toDraft(content))
                    setIsEditing(false)
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3>{content.title}</h3>
              <p>{content.description}</p>
              <div className="about-intro-grid">
                {content.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </>
          )}
          {message ? <p className="about-edit-message">{message}</p> : null}
        </section>
      </div>
    </section>
  )
}
