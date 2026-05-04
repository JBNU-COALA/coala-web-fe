import { useEffect, useState } from 'react'
import { communityPosts } from '../../data/postsData'
import { latestInfoUpdates, resourceCards } from '../../data/infoData'
import { recruitItems } from '../../data/recruitData'
import { useAuth } from '../../shared/auth/AuthContext'
import { boardsApi } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { Icon } from '../../shared/ui/Icon'
import { activityMembers } from '../leaderboard/leaderboardData'

type ProfileTab = 'overview' | 'activity' | 'posts'
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

function findPublicMember(profileUserId?: string) {
  const numericId = Number(profileUserId)
  const indexedMember = Number.isFinite(numericId) ? activityMembers[numericId - 1] : null

  return indexedMember ?? activityMembers.find((member) => member.isMe) ?? activityMembers[0]
}

export function ProfilePage({ profileUserId }: ProfilePageProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<ProfileTab>('overview')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('코알라에서 함께 개발하고 있습니다.')
  const [authoredContents, setAuthoredContents] = useState<AuthoredContentItem[]>([])

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
    { id: 'posts', label: '작성 내용' },
  ]

  return (
    <section className="coala-content coala-content--profile">
      <div className="profile-page">
        <div className="profile-page-hero surface-card">
          <div className="profile-page-hero-main">
            <span className="profile-page-avatar">{initial}</span>
            <div className="profile-page-identity">
              <h2 className="profile-page-name">{displayName}</h2>
              <p className="profile-page-role">{displayRole}</p>
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
          <div className="profile-section-grid">
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
              <h3 className="profile-section-title">계정 정보</h3>
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
                      <span className="profile-handle-value">{profileGithub ? `@${profileGithub}` : '-'}</span>
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
                      <span className="profile-handle-value">@{profileGithub}</span>
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
                  <span className="profile-activity-value profile-activity-value--mono">@{profileGithub}</span>
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
