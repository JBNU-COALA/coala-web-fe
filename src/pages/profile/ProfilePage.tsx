import { useEffect, useState } from 'react'
import { activityMembers, solvedTierMeta } from '../leaderboard/leaderboardData'
import { boardsApi } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { useAuth } from '../../shared/auth/AuthContext'
import { Icon } from '../../shared/ui/Icon'

type ProfileTab = 'overview' | 'activity' | 'posts'

export function ProfilePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<ProfileTab>('overview')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('안녕하세요! 코알라 동아리에서 활동하고 있어요.')
  const [myPosts, setMyPosts] = useState<PostListItem[]>([])

  const me = activityMembers.find((m) => m.isMe) ?? activityMembers[activityMembers.length - 1]
  const tierMeta = solvedTierMeta[me.solvedTier]

  const displayName = user?.name ?? user?.email ?? '사용자'
  const displayRole = user?.department ?? '동아리 멤버'
  const initial = displayName.charAt(0)

  const joinedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    : ''

  useEffect(() => {
    if (!user) return
    const fetchMyPosts = async () => {
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const all = postsArrays.flat().filter((p) => p.userId === user.id)
        setMyPosts(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      } catch {
        setMyPosts([])
      }
    }
    fetchMyPosts()
  }, [user])

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: '개요' },
    { id: 'activity', label: '활동 내역' },
    { id: 'posts', label: '작성 게시글' },
  ]

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ko-KR')
  }

  return (
    <section className="coala-content coala-content--profile">
      <div className="profile-page">

        {/* Hero */}
        <div className="profile-page-hero surface-card">
          <div className="profile-page-hero-main">
            <span className="profile-page-avatar">{initial}</span>
            <div className="profile-page-identity">
              <h2 className="profile-page-name">{displayName}</h2>
              <p className="profile-page-role">{displayRole}</p>
              {joinedAt && <p className="profile-page-joined">{joinedAt} 가입 · 동아리 코알라</p>}
            </div>
          </div>
          <button
            type="button"
            className={editing ? 'profile-edit-button profile-edit-button--active' : 'profile-edit-button'}
            onClick={() => setEditing((v) => !v)}
          >
            <Icon name="edit" size={13} />
            {editing ? '완료' : '프로필 편집'}
          </button>
        </div>

        {/* Stats */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value">{me.totalPoints.toLocaleString()}</p>
            <p className="profile-stat-label">활동 포인트</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className={`profile-stat-value profile-stat-value--tier solved-tier-color--${me.solvedTier}`}>
              {tierMeta.label}
            </p>
            <p className="profile-stat-label">백준 등급</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value profile-stat-value--github">{me.githubCommits}</p>
            <p className="profile-stat-label">GitHub 커밋</p>
          </div>
          <div className="profile-stat-card surface-card">
            <p className="profile-stat-value">{myPosts.length}개</p>
            <p className="profile-stat-label">작성 게시글</p>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab: 개요 */}
        {tab === 'overview' && (
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
              <ul className="profile-handles-list">
                <li className="profile-handle-item">
                  <span className="profile-handle-icon profile-handle-icon--baekjoon">
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
              </ul>
            </div>
          </div>
        )}

        {/* Tab: 활동 내역 */}
        {tab === 'activity' && (
          <div className="profile-section-grid">
            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">백준 현황</h3>
              <div className="profile-activity-block">
                <div className="profile-activity-row">
                  <span className="profile-activity-label">핸들</span>
                  <span className="profile-activity-value profile-activity-value--mono">{me.solvedHandle}</span>
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">등급</span>
                  <span className={`solved-tier-badge solved-tier-badge--${me.solvedTier}`}>{tierMeta.label}</span>
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">해결 문제</span>
                  <span className="profile-activity-value">{me.solvedCount}문제</span>
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">획득 포인트</span>
                  <span className="profile-activity-value">
                    {(me.solvedCount * tierMeta.pointsPerProblem).toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>

            <div className="surface-card profile-section-card">
              <h3 className="profile-section-title">GitHub 현황</h3>
              <div className="profile-activity-block">
                <div className="profile-activity-row">
                  <span className="profile-activity-label">핸들</span>
                  <span className="profile-activity-value profile-activity-value--mono">@{me.githubHandle}</span>
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">이번 달 커밋</span>
                  <span className="profile-activity-value profile-activity-value--github">{me.githubCommits}회</span>
                </div>
                <div className="profile-activity-row">
                  <span className="profile-activity-label">획득 포인트</span>
                  <span className="profile-activity-value">
                    {(me.githubCommits * 5).toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: 작성 게시글 */}
        {tab === 'posts' && (
          <div className="surface-card profile-section-card">
            <h3 className="profile-section-title">작성 게시글 ({myPosts.length})</h3>
            {myPosts.length === 0 ? (
              <p style={{ opacity: 0.5, fontSize: '0.875rem' }}>작성한 게시글이 없습니다.</p>
            ) : (
              <ul className="profile-post-list">
                {myPosts.map((post) => (
                  <li key={`${post.boardId}-${post.postId}`} className="profile-post-item">
                    <div className="profile-post-body">
                      <p className="profile-post-title">{post.title}</p>
                      <p className="profile-post-excerpt">
                        {post.content.replace(/<[^>]+>/g, '').slice(0, 80)}
                      </p>
                    </div>
                    <div className="profile-post-meta">
                      <span className="profile-post-time">{formatDate(post.createdAt)}</span>
                      <span className="profile-post-stat">
                        <Icon name="eye" size={11} />
                        {post.viewCount}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
