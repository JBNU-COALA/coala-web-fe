import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { siteApi, type SiteAboutContent } from '../../shared/api/site'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { useAuth } from '../../shared/auth/AuthContext'
import { routes } from '../../shared/routes'
import { Icon, type IconName } from '../../shared/ui/Icon'
import './about.css'

const defaultAboutContent: SiteAboutContent = { title: '', description: '', chips: [] }

const togetherLinks: { title: string; description: string; icon: IconName; route: string; tone: string }[] = [
  { title: '배워요', description: '스터디와 활동', icon: 'book', route: routes.community.activity, tone: 'mint' },
  { title: '만들어요', description: '프로젝트와 서비스', icon: 'network', route: routes.services.root, tone: 'blue' },
  { title: '나눠요', description: '기록과 정보공유', icon: 'message', route: routes.community.info, tone: 'coral' },
]

function toDraft(content: SiteAboutContent) {
  return { title: content.title, description: content.description, chipsText: content.chips.join(', ') }
}

export function AboutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = isAdminUser(user)
  const [content, setContent] = useState<SiteAboutContent>(defaultAboutContent)
  const [draft, setDraft] = useState(() => toDraft(defaultAboutContent))
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
    if (!draft.title.trim() || !draft.description.trim() || saving) return
    setSaving(true)
    setMessage(null)
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="coala-content coala-content--about">
      <div className="about-together">
        <header className="about-together-hero">
          <img src="/coala-card-placeholder.png" alt="노트북 앞에서 함께할 사람을 기다리는 코알라" />
          <div className="about-together-hero-copy about-together-container">
            <p>전북대학교 개발 동아리 코알라</p>
            <h1>같이 해요.</h1>
            <strong>코드도, 프로젝트도,<br />성장도 같이.</strong>
            <div>
              <button type="button" onClick={() => navigate(routes.community.activity)}>활동 보기</button>
              <button type="button" onClick={() => navigate(routes.community.recruit)}>모집 보기 <Icon name="chevron-right" size={16} /></button>
            </div>
          </div>
        </header>

        <main>
          <section className="about-together-intro about-together-container" aria-labelledby="about-intro-title">
            <div className="about-together-intro-head">
              <p>COALA</p>
              {canEdit ? (
                <button type="button" onClick={() => {
                  setDraft(toDraft(content))
                  setIsEditing((current) => !current)
                  setMessage(null)
                }}>
                  <Icon name="edit" size={15} /> 소개 수정
                </button>
              ) : null}
            </div>

            {isEditing ? (
              <form className="about-together-edit" onSubmit={saveAbout}>
                <label className="jcloud-field">
                  <span className="jcloud-label">제목</span>
                  <input className="jcloud-input" value={draft.title} maxLength={100} required
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label className="jcloud-field about-together-edit-wide">
                  <span className="jcloud-label">소개</span>
                  <textarea className="jcloud-textarea" rows={4} value={draft.description} maxLength={1000} required
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
                </label>
                <label className="jcloud-field about-together-edit-wide">
                  <span className="jcloud-label">키워드</span>
                  <input className="jcloud-input" value={draft.chipsText} placeholder="프로젝트, 스터디, 서비스 운영"
                    onChange={(event) => setDraft((current) => ({ ...current, chipsText: event.target.value }))} />
                </label>
                <div className="about-together-edit-actions">
                  <button type="button" disabled={saving} onClick={() => {
                    setDraft(toDraft(content))
                    setIsEditing(false)
                  }}>취소</button>
                  <button type="submit" disabled={saving}>{saving ? '저장 중' : '저장'}</button>
                </div>
              </form>
            ) : (
              <div className="about-together-intro-copy">
                <h2 id="about-intro-title">{content.title || '함께 만들고 운영하는 개발 동아리'}</h2>
                <div>
                  <p>{content.description || '코알라는 프로젝트, 스터디, 서비스 운영을 통해 개발 경험을 쌓는 전북대학교 개발 동아리입니다.'}</p>
                  {content.chips.length > 0 ? <p className="about-together-keywords">{content.chips.join(' · ')}</p> : null}
                </div>
              </div>
            )}
            {message ? <p className="about-together-message" role="status">{message}</p> : null}
          </section>

          <section className="about-together-links about-together-container" aria-label="코알라에서 함께하는 일">
            {togetherLinks.map((item) => (
              <button key={item.title} type="button" onClick={() => navigate(item.route)}>
                <span className={`about-together-icon about-together-icon--${item.tone}`}><Icon name={item.icon} size={22} /></span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
                <Icon name="chevron-right" size={17} />
              </button>
            ))}
          </section>

          <section className="about-together-join">
            <div className="about-together-container">
              <img src="/favicon-green.svg" alt="" />
              <h2>같이 해요.</h2>
              <p>처음이어도 괜찮아요. 함께 시작하면 됩니다.</p>
              <div>
                <button type="button" onClick={() => navigate(routes.community.recruit)}>모집 보기</button>
                <button type="button" onClick={() => navigate('/signup')}>회원가입</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </section>
  )
}
