/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  recruitsApi,
  type RecruitCategory,
  type RecruitComment,
  type RecruitItem,
  type RecruitPostPayload,
  type RecruitStatus,
} from '../../shared/api/recruits'
import { useAuth } from '../../shared/auth/AuthContext'
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

type RecruitEditDraft = {
  title: string
  shortDesc: string
  category: RecruitCategory
  status: RecruitStatus
  roles: string
  techStack: string
  meetingType: string
  expectedDuration: string
  tags: string
  detailContent: string
  processList: string
}

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

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)

const itemToDraft = (item: RecruitItem): RecruitEditDraft => ({
  title: item.title,
  shortDesc: item.shortDesc,
  category: item.category,
  status: item.status,
  roles: item.roles.map((role) => `${role.label}:${role.max}`).join('\n'),
  techStack: item.techStack.join(', '),
  meetingType: item.meetingType,
  expectedDuration: item.expectedDuration,
  tags: item.tags.join(', '),
  detailContent: item.detailContent.join('\n'),
  processList: item.processList.join('\n'),
})

const draftToPayload = (draft: RecruitEditDraft): RecruitPostPayload => ({
  title: draft.title.trim(),
  shortDesc: draft.shortDesc.trim(),
  category: draft.category,
  status: draft.status,
  roles: splitList(draft.roles).map((line) => {
    const matched = line.match(/^(.+?)[\s:：/]+(\d+)$/)
    return matched
      ? { label: matched[1].trim(), max: Number(matched[2]) || 1 }
      : { label: line, max: 1 }
  }),
  techStack: splitList(draft.techStack),
  meetingType: draft.meetingType.trim() || '협의 후 결정',
  expectedDuration: draft.expectedDuration.trim() || '협의 후 결정',
  tags: splitList(draft.tags).map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)),
  detailContent: splitList(draft.detailContent),
  processList: splitList(draft.processList),
})

export function RecruitDetailPage({ recruitId, onBack, onApply }: RecruitDetailPageProps) {
  const { isLoggedIn, user } = useAuth()
  const [comment, setComment] = useState('')
  const [localComments, setLocalComments] = useState<RecruitComment[]>([])
  const [saved, setSaved] = useState(false)
  const [remoteItem, setRemoteItem] = useState<RecruitItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<RecruitEditDraft | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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
    setIsEditing(false)
    setActionError(null)
    recruitsApi.getRecruit(recruitId)
      .then(setRemoteItem)
      .catch(() => setRemoteItem(null))
  }, [recruitId])

  useEffect(() => {
    if (item) setEditDraft(itemToDraft(item))
  }, [item])

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
  const isOperator = user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const canManageRecruit = Boolean(
    item.id.startsWith('local-recruit-') ||
    isOperator ||
    (user && item.authorId === user.id),
  )

  const updateEditDraft = <K extends keyof RecruitEditDraft>(key: K, value: RecruitEditDraft[K]) => {
    setEditDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  const handleUpdateRecruit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editDraft || !editDraft.title.trim() || !editDraft.shortDesc.trim()) return

    const payload = draftToPayload(editDraft)
    setActionError(null)
    try {
      if (item.id.startsWith('local-recruit-')) {
        const nextItem: RecruitItem = {
          ...item,
          title: payload.title,
          shortDesc: payload.shortDesc,
          category: payload.category,
          status: payload.status ?? item.status,
          maxMembers: payload.roles.reduce((sum, role) => sum + Math.max(role.max, 1), 0),
          tags: payload.tags,
          techStack: payload.techStack,
          roles: payload.roles.map((role) => ({ label: role.label, current: 0, max: Math.max(role.max, 1) })),
          meetingType: payload.meetingType,
          expectedDuration: payload.expectedDuration,
          detailContent: payload.detailContent,
          processList: payload.processList,
        }
        const nextItems = loadLocalRecruitItems().map((recruit) => (recruit.id === item.id ? nextItem : recruit))
        window.localStorage.setItem(LOCAL_RECRUIT_STORAGE_KEY, JSON.stringify(nextItems))
        setRemoteItem(nextItem)
        setIsEditing(false)
        return
      }

      const updated = await recruitsApi.updateRecruit(item.id, payload)
      setRemoteItem(updated)
      setIsEditing(false)
    } catch {
      setActionError('모집 공고를 수정하지 못했습니다.')
    }
  }

  const handleDeleteRecruit = async () => {
    const confirmed = window.confirm('모집 공고를 삭제할까요? 지원서와 댓글도 함께 삭제됩니다.')
    if (!confirmed) return

    setActionError(null)
    try {
      if (item.id.startsWith('local-recruit-')) {
        const nextItems = loadLocalRecruitItems().filter((recruit) => recruit.id !== item.id)
        window.localStorage.setItem(LOCAL_RECRUIT_STORAGE_KEY, JSON.stringify(nextItems))
        onBack()
        return
      }

      await recruitsApi.deleteRecruit(item.id)
      onBack()
    } catch {
      setActionError('모집 공고를 삭제하지 못했습니다.')
    }
  }

  const handleSubmitComment = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedComment = comment.trim()
    if (!trimmedComment || !isLoggedIn) return
    try {
      const created = await recruitsApi.createComment(item.id, trimmedComment)
      setLocalComments((current) => [...current, created])
      setComment('')
    } catch {
      setActionError('질문 등록에 실패했습니다.')
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
            {actionError ? <p className="auth-error">{actionError}</p> : null}
            <div className="recruit-detail-badges">
              <span className="recruit-detail-badge recruit-detail-badge--primary">RECRUITING</span>
              <span className="recruit-detail-badge recruit-detail-badge--secondary">
                {categoryLabelById[item.category]}
              </span>
            </div>

            <h2 className="recruit-detail-title">{item.title}</h2>

            {canManageRecruit ? (
              <div className="recruit-manage-actions">
                <button type="button" className="ghost-button" onClick={() => setIsEditing((value) => !value)}>
                  <Icon name="edit" size={14} />
                  {isEditing ? '수정 취소' : '수정'}
                </button>
                <button type="button" className="ghost-button" onClick={handleDeleteRecruit}>
                  <Icon name="file" size={14} />
                  삭제
                </button>
              </div>
            ) : null}

            {isEditing && editDraft ? (
              <form className="recruit-edit-form" onSubmit={handleUpdateRecruit}>
                <label className="jcloud-field">
                  <span className="jcloud-label">제목</span>
                  <input className="jcloud-input" value={editDraft.title} onChange={(event) => updateEditDraft('title', event.target.value)} />
                </label>
                <label className="jcloud-field">
                  <span className="jcloud-label">한 줄 소개</span>
                  <input className="jcloud-input" value={editDraft.shortDesc} onChange={(event) => updateEditDraft('shortDesc', event.target.value)} />
                </label>
                <div className="jcloud-field-row">
                  <label className="jcloud-field">
                    <span className="jcloud-label">분류</span>
                    <select className="jcloud-input" value={editDraft.category} onChange={(event) => updateEditDraft('category', event.target.value as RecruitCategory)}>
                      <option value="study">스터디</option>
                      <option value="project">프로젝트</option>
                      <option value="tutoring">멘토링</option>
                    </select>
                  </label>
                  <label className="jcloud-field">
                    <span className="jcloud-label">상태</span>
                    <select className="jcloud-input" value={editDraft.status} onChange={(event) => updateEditDraft('status', event.target.value as RecruitStatus)}>
                      <option value="open">모집중</option>
                      <option value="closing-soon">마감 임박</option>
                      <option value="closed">마감</option>
                    </select>
                  </label>
                </div>
                <label className="jcloud-field">
                  <span className="jcloud-label">역할/인원</span>
                  <textarea className="jcloud-textarea" rows={3} value={editDraft.roles} onChange={(event) => updateEditDraft('roles', event.target.value)} />
                </label>
                <label className="jcloud-field">
                  <span className="jcloud-label">기술 스택</span>
                  <input className="jcloud-input" value={editDraft.techStack} onChange={(event) => updateEditDraft('techStack', event.target.value)} />
                </label>
                <div className="jcloud-field-row">
                  <label className="jcloud-field">
                    <span className="jcloud-label">진행 방식</span>
                    <input className="jcloud-input" value={editDraft.meetingType} onChange={(event) => updateEditDraft('meetingType', event.target.value)} />
                  </label>
                  <label className="jcloud-field">
                    <span className="jcloud-label">예상 기간</span>
                    <input className="jcloud-input" value={editDraft.expectedDuration} onChange={(event) => updateEditDraft('expectedDuration', event.target.value)} />
                  </label>
                </div>
                <label className="jcloud-field">
                  <span className="jcloud-label">태그</span>
                  <input className="jcloud-input" value={editDraft.tags} onChange={(event) => updateEditDraft('tags', event.target.value)} />
                </label>
                <label className="jcloud-field">
                  <span className="jcloud-label">모집 소개</span>
                  <textarea className="jcloud-textarea" rows={4} value={editDraft.detailContent} onChange={(event) => updateEditDraft('detailContent', event.target.value)} />
                </label>
                <label className="jcloud-field">
                  <span className="jcloud-label">진행 프로세스</span>
                  <textarea className="jcloud-textarea" rows={3} value={editDraft.processList} onChange={(event) => updateEditDraft('processList', event.target.value)} />
                </label>
                <button type="submit" className="jcloud-submit-button">저장하기</button>
              </form>
            ) : null}

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

            {isLoggedIn ? (
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
            ) : (
              <p className="post-comment-login">질문 작성은 로그인 후 가능합니다.</p>
            )}

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
                if (!isLoggedIn) {
                  setActionError('관심 프로젝트 저장은 로그인 후 가능합니다.')
                  return
                }
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
