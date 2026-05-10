/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { communityPosts } from '../../dummy/postsData'
import { latestInfoUpdates, resourceCards } from '../../dummy/infoData'
import { recruitItems } from '../../dummy/recruitData'
import { useAuth } from '../../shared/auth/AuthContext'
import { boardsApi } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { Icon } from '../../shared/ui/Icon'
import { activityMembers, type UserAward } from '../../dummy/leaderboardData'

type ProfileTab = 'overview' | 'activity' | 'awards' | 'posts'
type AuthoredContentKind = 'board' | 'info' | 'recruit'

type AuthoredContentItem = {
  id: string
  kind: AuthoredContentKind
  title: string
  excerpt: string
  createdAt: string
  viewCount?: number
}

const contentKindLabel: Record<AuthoredContentKind, string> = {
  board: '게시판',
  info: '정보공유',
  recruit: '모집',
}

const genderLabel = {
  MALE: '남성',
  FEMALE: '여성',
  OTHER: '기타',
  PREFER_NOT_TO_SAY: '응답 안 함',
} as const

const academicStatusLabel = {
  ENROLLED: '재학',
  ON_LEAVE: '휴학',
  GRADUATED: '졸업',
} as const

const awardCategoryLabel: Record<UserAward['category'], string> = {
  competition: '대회',
  hackathon: '해커톤',
  research: '연구',
  club: '동아리',
}

const PROFILE_PHOTO_MAX_SIZE = 3 * 1024 * 1024

type ProfilePageProps = {
  profileUserId?: string
}

function apiPostToAuthoredContent(post: PostListItem): AuthoredContentItem {
  const boardName = post.boardName ?? ''
  const kind: AuthoredContentKind =
    boardName.toLowerCase().includes('recruit') || boardName.includes('모집')
      ? 'recruit'
      : 'board'

  return {
    id: `api-${post.boardId}-${post.postId}`,
    kind,
    title: post.title,
    excerpt: post.content.replace(/<[^>]+>/g, '').slice(0, 100),
    createdAt: post.createdAt,
    viewCount: post.viewCount,
  }
}

function parseViewCount(value: string) {
  if (value.includes('k')) return Math.round(Number(value.replace('k', '')) * 1000)
  return Number(value.replace(/[^0-9]/g, '')) || 0
}

function createFallbackAuthoredContents(displayName: string): AuthoredContentItem[] {
  const boardItems = communityPosts.slice(0, 2).map((post) => ({
    id: `board-${post.id}`,
    kind: 'board' as const,
    title: post.title,
    excerpt: post.excerpt,
    createdAt: post.publishedAt,
    viewCount: parseViewCount(post.views),
  }))

  const infoItems = [
    ...latestInfoUpdates.slice(0, 1).map((item) => ({
      id: `info-${item.id}`,
      kind: 'info' as const,
      title: item.title,
      excerpt: item.summary,
      createdAt: item.timestamp,
    })),
    ...resourceCards.slice(0, 1).map((item) => ({
      id: `resource-${item.id}`,
      kind: 'info' as const,
      title: item.title,
      excerpt: `${item.tag} · ${item.source}`,
      createdAt: item.meta,
    })),
  ]

  const recruitAuthoredItems = recruitItems.slice(0, 2).map((item) => ({
    id: `recruit-${item.id}`,
    kind: 'recruit' as const,
    title: item.title,
    excerpt: item.shortDesc,
    createdAt: item.createdAt,
    viewCount: item.views,
  }))

  return [...boardItems, ...infoItems, ...recruitAuthoredItems].map((item, index) => ({
    ...item,
    excerpt: index === 0 ? `${displayName}님이 작성한 예시 콘텐츠입니다. ${item.excerpt}` : item.excerpt,
  }))
}

function formatDate(dateStr: string) {
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('ko-KR')
}

function formatAwardDate(dateStr: string) {
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
}

function findPublicMember(profileUserId?: string) {
  const numericId = Number(profileUserId)
  const indexedMember = Number.isFinite(numericId) ? activityMembers[numericId - 1] : null

  return indexedMember ?? activityMembers.find((member) => member.isMe) ?? activityMembers[0]
}

function normalizeGithubHandle(value?: string | null) {
  return value?.trim().replace(/^@+/, '') ?? ''
}

function getGithubProfileUrl(value?: string | null) {
  const handle = normalizeGithubHandle(value)
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(handle)) return null
  return `https://github.com/${encodeURIComponent(handle)}`
}

export function ProfilePage({ profileUserId }: ProfilePageProps) {
  const { user } = useAuth()
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const [tab, setTab] = useState<ProfileTab>('overview')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('코알라에서 함께 개발하고 있습니다.')
  const [authoredContents, setAuthoredContents] = useState<AuthoredContentItem[]>([])
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const effectiveProfileUserId = profileUserId ?? (user ? String(user.id) : '1')
  const isOwnProfile = Boolean(user && String(user.id) === effectiveProfileUserId)
  const publicMember = findPublicMember(effectiveProfileUserId)
  const profileMember = isOwnProfile
    ? activityMembers.find((member) => member.isMe) ?? publicMember
    : publicMember
  const canEdit = isOwnProfile

  const displayName = isOwnProfile ? user?.name ?? user?.email ?? '사용자' : profileMember.name
  const displayRole = isOwnProfile && user?.academicStatus
    ? `${academicStatusLabel[user.academicStatus]} · ${user.grade ?? '-'}학년`
    : `${profileMember.grade} · ${profileMember.role}`
  const initial = displayName.charAt(0)
  const joinedAt = isOwnProfile && user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    : ''
  const profileGithub = isOwnProfile ? user?.githubId ?? profileMember.githubHandle : profileMember.githubHandle
  const profileGithubHandle = normalizeGithubHandle(profileGithub)
  const profileGithubLabel = profileGithubHandle ? `@${profileGithubHandle}` : '-'
  const profileGithubUrl = getGithubProfileUrl(profileGithub)
  const profileAwards = profileMember.awards
  const profilePhotoStorageKey = `coala-profile-photo:${effectiveProfileUserId}`

  useEffect(() => {
    if (typeof window === 'undefined') return
    setProfilePhoto(window.localStorage.getItem(profilePhotoStorageKey))
    setPhotoError(null)
  }, [profilePhotoStorageKey])

  useEffect(() => {
    setEditing(false)
    setBio(canEdit ? '코알라에서 함께 개발하고 있습니다.' : profileMember.focus)
  }, [canEdit, effectiveProfileUserId, profileMember.focus])

  useEffect(() => {
    if (!isOwnProfile || !user) {
      setAuthoredContents(createFallbackAuthoredContents(displayName))
      return
    }

    const fetchAuthoredContents = async () => {
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const apiContents = postsArrays
          .flat()
          .filter((p) => p.userId === user.id)
          .map(apiPostToAuthoredContent)

        setAuthoredContents(
          apiContents.length > 0
            ? apiContents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            : createFallbackAuthoredContents(displayName),
        )
      } catch {
        setAuthoredContents(createFallbackAuthoredContents(displayName))
      }
    }

    fetchAuthoredContents()
  }, [displayName, isOwnProfile, user])

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: '개요' },
    { id: 'activity', label: '활동 내역' },
    { id: 'awards', label: '수상 내역' },
    { id: 'posts', label: '작성 내용' },
  ]

  const handlePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('이미지 파일만 등록할 수 있습니다.')
      return
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE) {
      setPhotoError('프로필 사진은 3MB 이하만 등록할 수 있습니다.')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        setPhotoError('이미지를 읽지 못했습니다.')
        return
      }

      window.localStorage.setItem(profilePhotoStorageKey, reader.result)
      setProfilePhoto(reader.result)
      setPhotoError(null)
    })
    reader.addEventListener('error', () => setPhotoError('이미지를 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  }

  const removeProfilePhoto = () => {
    window.localStorage.removeItem(profilePhotoStorageKey)
    setProfilePhoto(null)
    setPhotoError(null)
  }

  return (
    <section className="coala-content coala-content--profile">
      <div className="profile-page">
        <div className="profile-page-hero surface-card">
          <div className="profile-page-hero-main">
            <div className="profile-photo-panel">
              <div className={profilePhoto ? 'profile-page-avatar profile-page-avatar--image' : 'profile-page-avatar'}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt={`${displayName} 프로필 사진`} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              {canEdit ? (
                <div className="profile-photo-controls">
                  <button type="button" className="profile-photo-button" onClick={() => photoInputRef.current?.click()}>
                    사진 변경
                  </button>
                  {profilePhoto ? (
                    <button type="button" className="profile-photo-button profile-photo-button--muted" onClick={removeProfilePhoto}>
                      삭제
                    </button>
                  ) : null}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="profile-photo-input"
                    onChange={handlePhotoSelect}
                  />
                  {photoError ? <p className="profile-photo-error">{photoError}</p> : null}
                </div>
              ) : null}
            </div>
            <div className="profile-page-identity">
              <h2 className="profile-page-name">{displayName}</h2>
              <p className="profile-page-role">{displayRole}</p>
              <div className="profile-page-meta">
                <span>{isOwnProfile ? user?.department ?? '소속 미입력' : profileMember.lab}</span>
                {profileGithubUrl ? (
                  <a href={profileGithubUrl} target="_blank" rel="noreferrer">
                    {profileGithubLabel}
                  </a>
                ) : (
                  <span>{profileGithubLabel}</span>
                )}
              </div>
              {joinedAt ? <p className="profile-page-joined">{joinedAt} 가입 · 동아리 코알라</p> : null}
            </div>
          </div>
          {canEdit ? (
            <button
              type="button"
              className={editing ? 'profile-edit-button profile-edit-button--active' : 'profile-edit-button'}
              onClick={() => setEditing((v) => !v)}
            >
              <Icon name="edit" size={13} />
              {editing ? '완료' : '프로필 편집'}
            </button>
          ) : null}
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value">{profileMember.totalPoints.toLocaleString()}</p>
            <p className="profile-stat-label">활동 점수</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value profile-stat-value--github">{profileMember.githubCommits}</p>
            <p className="profile-stat-label">GitHub 커밋</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value">{profileMember.sharedRepos.length}개</p>
            <p className="profile-stat-label">공유 저장소</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value profile-stat-value--award">{profileAwards.length}개</p>
            <p className="profile-stat-label">수상 내역</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value">{authoredContents.length}개</p>
            <p className="profile-stat-label">작성 내용</p>
          </div>
        </div>

        <div className="profile-tab-bar">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'profile-tab is-active' : 'profile-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="profile-section-grid profile-section-grid--overview">
            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">소개</h3>
              {editing ? (
                <textarea
                  className="profile-bio-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="profile-bio-text">{bio}</p>
              )}
            </div>

            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">기본 정보</h3>
              {canEdit ? (
                <ul className="profile-handles-list">
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="user" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">이메일</span>
                      <span className="profile-handle-value">{user?.email ?? '-'}</span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="file" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">학번</span>
                      <span className="profile-handle-value">{user?.studentId ?? '-'}</span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="users" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">성별 / 학적</span>
                      <span className="profile-handle-value">
                        {user?.gender ? genderLabel[user.gender] : '-'} ·{' '}
                        {user?.academicStatus ? academicStatusLabel[user.academicStatus] : '-'}
                      </span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="network" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">GitHub</span>
                      {profileGithubUrl ? (
                        <a className="profile-handle-value profile-handle-link" href={profileGithubUrl} target="_blank" rel="noreferrer">
                          {profileGithubLabel}
                        </a>
                      ) : (
                        <span className="profile-handle-value">{profileGithubLabel}</span>
                      )}
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="link" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">LinkedIn</span>
                      <span className="profile-handle-value">{user?.linkedinUrl ?? '등록 안 함'}</span>
                    </span>
                  </li>
                </ul>
              ) : (
                <ul className="profile-handles-list">
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="network" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">GitHub</span>
                      {profileGithubUrl ? (
                        <a className="profile-handle-value profile-handle-link" href={profileGithubUrl} target="_blank" rel="noreferrer">
                          {profileGithubLabel}
                        </a>
                      ) : (
                        <span className="profile-handle-value">{profileGithubLabel}</span>
                      )}
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="users" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">소속</span>
                      <span className="profile-handle-value">{profileMember.lab}</span>
                    </span>
                  </li>
                  <li className="profile-handle-item">
                    <span className="profile-handle-icon profile-handle-icon--github">
                      <Icon name="file" size={14} />
                    </span>
                    <span className="profile-handle-body">
                      <span className="profile-handle-service">역할</span>
                      <span className="profile-handle-value">{profileMember.role}</span>
                    </span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'activity' ? (
          <div className="profile-section-grid">
            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">GitHub 현황</h3>
              <div className="profile-activity-block">
                <div className="profile-activity-row">
                  <span className="profile-activity-label">핸들</span>
                  {profileGithubUrl ? (
                    <a className="profile-activity-value profile-activity-link" href={profileGithubUrl} target="_blank" rel="noreferrer">
                      {profileGithubLabel}
                    </a>
                  ) : (
                    <span className="profile-activity-value profile-activity-value--mono">{profileGithubLabel}</span>
                  )}
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">최근 커밋</span>
                  <span className="profile-activity-value profile-activity-value--github">
                    {profileMember.githubCommits}개
                  </span>
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">저장소</span>
                  <span className="profile-activity-value">{profileMember.sharedRepos.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'awards' ? (
          <div className="surface-card profile-section-card">
            <h3 className="profile-section-title">수상 내역 ({profileAwards.length})</h3>
            {profileAwards.length === 0 ? (
              <p style={{ opacity: 0.5, fontSize: '0.875rem' }}>등록된 수상 내역이 없습니다.</p>
            ) : (
              <ul className="profile-award-list">
                {profileAwards.map((award) => (
                  <li key={award.awardId} className="profile-award-item">
                    <div className="profile-award-main">
                      <span className={`profile-award-category profile-award-category--${award.category}`}>
                        {awardCategoryLabel[award.category]}
                      </span>
                      <p className="profile-award-title">{award.title}</p>
                      <p className="profile-award-description">{award.description}</p>
                    </div>
                    <div className="profile-award-meta">
                      <strong>{award.rank}</strong>
                      <span>{award.organizer}</span>
                      <span>{formatAwardDate(award.awardedAt)}</span>
                      {award.credentialUrl ? (
                        <a href={award.credentialUrl} target="_blank" rel="noreferrer">
                          확인 링크
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === 'posts' ? (
          <div className="surface-card profile-section-card">
            <h3 className="profile-section-title">작성 내용 ({authoredContents.length})</h3>
            {authoredContents.length === 0 ? (
              <p style={{ opacity: 0.5, fontSize: '0.875rem' }}>작성한 내용이 없습니다.</p>
            ) : (
              <ul className="profile-post-list">
                {authoredContents.map((item) => (
                  <li key={item.id} className="profile-post-item">
                    <div className="profile-post-body">
                      <span className={`profile-content-kind profile-content-kind--${item.kind}`}>
                        {contentKindLabel[item.kind]}
                      </span>
                      <p className="profile-post-title">{item.title}</p>
                      <p className="profile-post-excerpt">{item.excerpt}</p>
                    </div>
                    <div className="profile-post-meta">
                      <span className="profile-post-time">{formatDate(item.createdAt)}</span>
                      {typeof item.viewCount === 'number' ? (
                        <span className="profile-post-stat">
                          <Icon name="eye" size={11} />
                          {item.viewCount}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
