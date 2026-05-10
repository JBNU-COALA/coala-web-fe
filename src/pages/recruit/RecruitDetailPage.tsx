/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { recruitsApi, type RecruitComment, type RecruitItem } from '../../shared/api/recruits'
import { Icon } from '../../shared/ui/Icon'

type RecruitDetailPageProps = {
  recruitId: string
  onBack: () => void
  onApply: (id: string) => void
}

const categoryLabelById = {
  study: '스터디',
  project: '사이드 프로젝트',
  tutoring: '멘토링',
} as const

const LOCAL_RECRUIT_STORAGE_KEY = 'coala-local-recruits'

const loadLocalRecruitItems = (): RecruitItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LOCAL_RECRUIT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function RecruitDetailPage({ recruitId, onBack, onApply }: RecruitDetailPageProps) {
  const [comment, setComment] = useState('')
  const [localComments, setLocalComments] = useState<RecruitComment[]>([])
  const [saved, setSaved] = useState(false)
  const [remoteItem, setRemoteItem] = useState<RecruitItem | null>(null)

  const item = useMemo(() => {
    const localRecruitItems = loadLocalRecruitItems()
    return (
      localRecruitItems.find((recruit) => recruit.id === recruitId)
      ?? remoteItem
    )
  }, [recruitId, remoteItem])

  useEffect(() => {
    setLocalComments([])
    setSaved(false)
    recruitsApi.getRecruit(recruitId)
      .then(setRemoteItem)
      .catch(() => setRemoteItem(null))
  }, [recruitId])

  if (!item) {
    return (
      <section className="coala-content coala-content--recruit">
        <div className="surface-card recruit-application-empty">
          <strong>모집 공고를 불러오는 중입니다.</strong>
          <button type="button" className="recruit-row-button recruit-row-button--primary" onClick={onBack}>
            목록으로 돌아가기
          </button>
        </div>
      </section>
    )
  }

  const comments = [...item.comments, ...localComments]
  const totalCurrent = item.roles.reduce((sum, role) => sum + role.current, 0)
  const totalMax = item.roles.reduce((sum, role) => sum + role.max, 0)
  const participationRate = totalMax > 0 ? (totalCurrent / totalMax) * 100 : 0
  const isOpen = item.status !== 'closed'

  const handleSubmitComment = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedComment = comment.trim()
    if (!trimmedComment) return
    try {
      const created = await recruitsApi.createComment(item.id, trimmedComment)
      setLocalComments((current) => [...current, created])
      setComment('')
    } catch {
      setLocalComments((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          author: '나',
          authorInitials: '나',
          authorTone: 'mint',
          timeLabel: '방금 전',
          content: trimmedComment,
        },
      ])
      setComment('')
    }
  }

  return (
    <section className="coala-content coala-content--recruit">
      <div className="recruit-detail-shell">
        <div className="recruit-detail-main">
          <button type="button" className="recruit-detail-back" onClick={onBack}>
            <Icon name="chevron-left" size={14} />
            목록으로 돌아가기
          </button>

          <article className="surface-card recruit-detail-card">
            <div className="recruit-detail-badges">
              <span className="recruit-detail-badge recruit-detail-badge--primary">RECRUITING</span>
              <span className="recruit-detail-badge recruit-detail-badge--secondary">
                {categoryLabelById[item.category]}
              </span>
            </div>

            <h2 className="recruit-detail-title">{item.title}</h2>

            <p className="recruit-detail-meta">
              <span className="recruit-meta-item">
                <Icon name="calendar" size={12} />
                작성일 {item.createdAt}
              </span>
              <span className="dot-divider" />
              <span className="recruit-meta-item">
                <Icon name="eye" size={12} />
                조회수 {item.views.toLocaleString()}
              </span>
              <span className="dot-divider" />
              <span className="recruit-meta-item">
                <Icon name="message" size={12} />
                북마크 {item.bookmarks}
              </span>
            </p>

            <div className="recruit-info-grid">
              <div className="recruit-info-cell">
                <span className="recruit-info-label">모집 분야</span>
                <span className="recruit-info-value">{item.roles.map((role) => role.label).join(', ')}</span>
              </div>
              <div className="recruit-info-cell">
                <span className="recruit-info-label">진행 방식</span>
                <span className="recruit-info-value">{item.meetingType}</span>
              </div>
              <div className="recruit-info-cell">
                <span className="recruit-info-label">예상 기간</span>
                <span className="recruit-info-value">{item.expectedDuration}</span>
              </div>
              <div className="recruit-info-cell">
                <span className="recruit-info-label">기술 스택</span>
                <div className="recruit-tech-stack">
                  {item.techStack.map((tech) => (
                    <span key={tech} className="recruit-tech-chip">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="surface-card recruit-detail-card recruit-content-card">
            <h3 className="recruit-content-title">
              <span className="recruit-content-title-bar" />
              모집 소개
            </h3>

            {item.detailContent.map((paragraph) => (
              <p key={paragraph} className="recruit-content-para">
                {paragraph}
              </p>
            ))}

            <div className="recruit-process-section">
              <p className="recruit-process-label">진행 프로세스</p>
              <ul className="recruit-process-list">
                {item.processList.map((process) => (
                  <li key={process} className="recruit-process-item">
                    <span className="recruit-process-check">✓</span>
                    <span>{process}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="surface-card recruit-detail-card">
            <h3 className="recruit-content-title">
              질문과 답변 <span className="recruit-qa-count">{comments.length}</span>
            </h3>

            <form className="recruit-qa-form" onSubmit={handleSubmitComment}>
              <textarea
                className="recruit-qa-textarea"
                placeholder="궁금한 점을 남겨주세요."
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <div className="recruit-qa-form-footer">
                <button type="submit" className="recruit-qa-submit" disabled={!comment.trim()}>
                  질문 등록
                </button>
              </div>
            </form>

            <ul className="recruit-comment-list">
              {comments.map((itemComment) => (
                <li key={itemComment.id} className="recruit-comment">
                  <span className={`board-avatar board-avatar--${itemComment.authorTone}`}>
                    {itemComment.authorInitials}
                  </span>
                  <div className="recruit-comment-body">
                    <div className="recruit-comment-header">
                      <span className="recruit-comment-author">{itemComment.author}</span>
                      <span className="recruit-comment-time">{itemComment.timeLabel}</span>
                    </div>
                    <p className="recruit-comment-content">{itemComment.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <aside className="recruit-detail-sidebar">
          <div className="surface-card recruit-participation-card">
            <p className="recruit-participation-label">참여 현황</p>
            <div className="recruit-member-count-row">
              <span className="recruit-member-count">
                {totalCurrent} / {totalMax}명
              </span>
              <span className="recruit-member-sub">참여 중</span>
            </div>
            <div className="recruit-progress-track">
              <div className="recruit-progress-fill" style={{ width: `${participationRate}%` }} />
            </div>

            <ul className="recruit-role-list">
              {item.roles.map((role) => {
                const isFull = role.current >= role.max
                return (
                  <li key={role.label} className="recruit-role-item">
                    <span className="recruit-role-label">{role.label}</span>
                    <span className={`recruit-role-count ${isFull ? 'recruit-role-count--full' : ''}`}>
                      {role.current}/{role.max}
                      {isFull ? ' (마감)' : ''}
                    </span>
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              className={
                isOpen ? 'recruit-apply-button' : 'recruit-apply-button recruit-apply-button--closed'
              }
              disabled={!isOpen}
              onClick={() => onApply(item.id)}
            >
              {isOpen ? '지원하기' : '모집이 마감되었습니다'}
            </button>
            <button
              type="button"
              className={saved ? 'recruit-interest-button recruit-interest-button--active' : 'recruit-interest-button'}
              aria-pressed={saved}
              onClick={() => {
                setSaved((current) => !current)
                recruitsApi.bookmark(item.id).catch(() => {})
              }}
            >
              {saved ? '관심 프로젝트 저장됨' : '관심 프로젝트로 저장'}
            </button>
          </div>

          <div className="surface-card recruit-host-card">
            <p className="recruit-host-section-label">모집 주최자</p>
            <div className="recruit-host-info">
              <span className={`leader-avatar leader-avatar--${item.hostTone}`}>{item.hostInitials}</span>
              <div>
                <p className="recruit-host-name">{item.host}</p>
                <p className="recruit-host-role">{item.hostRole}</p>
              </div>
            </div>

            <div className="recruit-trust-section">
              <div className="recruit-trust-header">
                <span className="recruit-trust-label">신뢰도</span>
                <span className="recruit-trust-value">{item.trustScore.toFixed(1)}%</span>
              </div>
              <div className="recruit-trust-track">
                <div className="recruit-trust-fill" style={{ width: `${item.trustScore}%` }} />
              </div>
              <p className="recruit-trust-desc">
                최근 6개월 내 프로젝트 운영/리뷰 이력과 피드백 응답 속도를 기준으로 산정한 지표입니다.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
