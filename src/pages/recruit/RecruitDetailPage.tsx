/* eslint-disable react-hooks/set-state-in-effect */
import { buildRecruitPayload, itemToDraft, type RecruitDraft } from './recruitDraft'
import { mutationError } from '../../shared/api/mutationError'
import { useEffect, useState, type FormEvent } from 'react'
import {
  recruitsApi,
  type RecruitComment,
  type RecruitItem,
  type RecruitCategory,
  type RecruitStatus,
} from '../../shared/api/recruits'
import { useAuth } from '../../shared/auth/AuthContext'
import { isSameUserId } from '../../shared/auth/userIdentity'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { Icon } from '../../shared/ui/Icon'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { StudyConnections } from '../../shared/ui/StudyConnections'
import { RecruitParticipants } from './RecruitParticipants'

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

export function RecruitDetailPage({ recruitId, onBack, onApply }: RecruitDetailPageProps) {
  const { isLoggedIn, user } = useAuth()
  const [comment, setComment] = useState('')
  const [localComments, setLocalComments] = useState<RecruitComment[]>([])
  const [saved, setSaved] = useState(false)
  const [remoteItem, setRemoteItem] = useState<RecruitItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<RecruitDraft | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [membershipRevision, setMembershipRevision] = useState(0)

  const item = remoteItem?.id === recruitId ? remoteItem : null
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLocalComments([])
    setSaved(false)
    setIsEditing(false)
    setActionError(null)
    let active = true
    setLoading(true)
    recruitsApi.getRecruit(recruitId)
      .then((value) => { if (active) setRemoteItem(value) })
      .catch(() => { if (active) { setRemoteItem(null); setActionError('모집 공고를 불러오지 못했습니다.') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [recruitId])

  useEffect(() => {
    if (item) setEditDraft(itemToDraft(item))
  }, [item])

  if (!item) {
    return (
      <section className="coala-content coala-content--recruit">
        <div className="surface-card recruit-application-empty">
          <strong>{loading ? '모집 공고를 불러오는 중입니다.' : actionError || '모집 공고가 없습니다.'}</strong>
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
  const isOperator = isAdminUser(user)
  const canManageRecruit = Boolean(
    isOperator ||
    isSameUserId(item.authorId, user?.id),
  )

  const updateEditDraft = <K extends keyof RecruitDraft>(key: K, value: RecruitDraft[K]) => {
    setEditDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  const handleUpdateRecruit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editDraft || !editDraft.title.trim() || !editDraft.shortDesc.trim()) return

    setActionError(null)
    try {
      const payload = buildRecruitPayload(editDraft)
      const updated = await recruitsApi.updateRecruit(item.id, payload)
      setRemoteItem(updated)
      setIsEditing(false)
    } catch (error) {
      setActionError(mutationError(error, '모집 공고를 수정하지 못했습니다. 작성 내용은 유지됩니다.'))
    }
  }

  const handleDeleteRecruit = async () => {
    const confirmed = window.confirm('모집 공고를 삭제할까요? 지원서와 댓글도 함께 삭제됩니다.')
    if (!confirmed) return

    setActionError(null)
    try {
      await recruitsApi.deleteRecruit(item.id)
      onBack()
    } catch (error) {
      setActionError(mutationError(error, '모집 공고를 삭제하지 못했습니다.'))
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
    <section className="coala-content coala-content--recruit recruit-detail-page">
      <div className="recruit-detail-shell">
        <div className="recruit-detail-main">
          <button type="button" className="recruit-detail-back" onClick={onBack}>
            <Icon name="chevron-left" size={14} />
            목록으로 돌아가기
          </button>

          <article className="recruit-detail-card recruit-detail-hero-card">
            {actionError ? <p className="auth-error">{actionError}</p> : null}
            <div className="recruit-detail-badges">
              <span className="recruit-detail-badge recruit-detail-badge--primary">
                {item.status === 'open' ? '모집 중' : item.status === 'closing-soon' ? '마감 임박' : '모집 마감'}
              </span>
              <span className="recruit-detail-badge recruit-detail-badge--secondary">
                {categoryLabelById[item.category]}
              </span>
            </div>

            <h1 className="recruit-detail-title">{item.title}</h1>
            <p className="recruit-detail-summary">{item.shortDesc}</p>

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

            <dl className="recruit-detail-facts" aria-label="모집 정보">
              <div className="recruit-detail-fact">
                <dt>모집 분야</dt>
                <dd>{item.roles.map((role) => role.label).join(', ')}</dd>
              </div>
              <div className="recruit-detail-fact">
                <dt>진행 방식</dt>
                <dd>{item.meetingType}</dd>
              </div>
              <div className="recruit-detail-fact">
                <dt>예상 기간</dt>
                <dd>{item.expectedDuration}</dd>
              </div>
              <div className="recruit-detail-fact recruit-detail-fact--stack">
                <dt>기술 스택</dt>
                <dd className="recruit-tech-stack">
                  {item.techStack.map((tech) => (
                    <span key={tech} className="recruit-tech-chip">
                      {tech}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </article>

          <article className="recruit-detail-card recruit-content-card recruit-detail-section-card">
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
              <ol className="recruit-process-list">
                {item.processList.map((process, index) => (
                  <li key={process} className="recruit-process-item">
                    <span className="recruit-process-check">{index + 1}</span>
                    <span>{process}</span>
                  </li>
                ))}
              </ol>
            </div>
          </article>

          <article className="recruit-detail-card recruit-detail-section-card recruit-qa-card">
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
                  <CharacterAvatar
                    name={itemComment.author}
                    seed={`${item.id}-${itemComment.author}`}
                    size="xs"
                    className="board-avatar"
                  />
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
          <StudyConnections key={membershipRevision} recruitId={item.id} canManage={canManageRecruit} />
          {canManageRecruit && <RecruitParticipants recruitId={item.id} onChange={() => {
            setMembershipRevision((value) => value + 1)
            recruitsApi.getRecruit(item.id).then(setRemoteItem).catch(() => setActionError('참여 인원을 새로 불러오지 못했습니다.'))
          }} />}
          <section className="recruit-participation-card">
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
              <Icon name="heart" size={16} />
              {saved ? '관심 공고 저장됨' : '관심 공고 저장'}
            </button>
          </section>

          <section className="recruit-host-card">
            <p className="recruit-host-section-label">모집 주최자</p>
            <div className="recruit-host-info">
              <CharacterAvatar name={item.host} seed={item.authorId ?? item.host} size="md" className="leader-avatar" />
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
          </section>
        </aside>
      </div>
    </section>
  )
}
