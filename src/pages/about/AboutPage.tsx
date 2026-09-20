import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { siteApi, type SiteAboutContent } from '../../shared/api/site'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { useAuth } from '../../shared/auth/AuthContext'
import { Icon } from '../../shared/ui/Icon'
import { PageHero } from '../../shared/ui/PageHero'
import { SectionHeading } from '../../shared/ui/SectionHeading'
import { SafeImage } from '../../shared/ui/SafeImage'
import { routes } from '../../shared/routes'

const defaultAboutContent: SiteAboutContent = { title: '', description: '', chips: [] }

function toDraft(content: SiteAboutContent) {
  return {
    title: content.title,
    description: content.description,
    chipsText: content.chips.join(', '),
  }
}

export function AboutPage() {
  const navigate = useNavigate()
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
      .catch(() => setMessage('소개 내용을 불러오지 못했습니다.'))
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
        <PageHero
          title="동아리 코알라"
          eyebrow="JEONBUK NATIONAL UNIVERSITY"
          description="함께 만들고 운영하는 개발 동아리"
          meta="전북대학교 컴퓨터인공지능학부 · Since 2018"
          tone="about"
          size="large"
          headingLevel="h1"
          action={(
            <button type="button" className="page-hero-button" onClick={() => navigate(routes.community.board)}>
              활동 보기
              <Icon name="chevron-right" size={15} />
            </button>
          )}
        />

        <section className="about-intro">
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
              {content.title ? <SectionHeading title={content.title} description={content.description} /> : <p>등록된 소개가 없습니다.</p>}
              <div className="about-intro-grid">
                {content.chips.map((chip, index) => (
                  <article key={chip}>
                    <span className="about-capability-icon">
                      <Icon name={(['file', 'book', 'settings', 'users'] as const)[index % 4]} size={22} />
                    </span>
                    <strong>{chip}</strong>
                  </article>
                ))}
              </div>
            </>
          )}
          {message ? <p className="about-edit-message">{message}</p> : null}
        </section>

        <section className="about-now-section">
          <SectionHeading title="지금 코알라에서는" description="프로젝트, 정보, 서비스를 한곳에서 확인하세요." />
          <div className="about-now-grid">
            {[
              { label: '프로젝트', title: 'COAS 오픈소스 프로젝트', description: '코알라의 서비스를 함께 만들고 운영합니다.', path: routes.services.root, icon: 'network' as const },
              { label: '커뮤니티', title: '정보와 경험 공유', description: '개발 자료와 동아리 소식을 나눕니다.', path: routes.community.info, icon: 'book' as const },
              { label: '모집', title: '함께할 팀 찾기', description: '스터디와 프로젝트 멤버를 찾습니다.', path: routes.community.recruit, icon: 'users' as const },
            ].map((item) => (
              <button key={item.label} type="button" className="about-now-card" onClick={() => navigate(item.path)}>
                <span className="about-now-media">
                  <SafeImage
                    src="/coala-card-placeholder.png"
                    alt=""
                    loading="lazy"
                    fallback={<img src="/coala-card-placeholder.png" alt="" loading="lazy" />}
                  />
                </span>
                <span className="about-now-card-body">
                  <small><Icon name={item.icon} size={14} />{item.label}</small>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <span className="about-now-card-meta">COALA <Icon name="chevron-right" size={16} /></span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="about-join-band">
          <div>
            <h2>함께할 준비가 되었나요?</h2>
            <p>코알라의 활동을 살펴보고 함께해 주세요.</p>
          </div>
          <div>
            <button type="button" className="ghost-button" onClick={() => navigate(routes.community.board)}>커뮤니티 보기</button>
            <button type="button" className="jcloud-submit-button" onClick={() => navigate('/signup')}>회원가입</button>
          </div>
        </section>
      </div>
    </section>
  )
}
