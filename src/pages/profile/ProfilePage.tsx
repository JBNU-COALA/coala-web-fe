import { useState } from 'react'
import { profileSummary } from '../../features/home/model/homeData'
import { activityMembers, solvedTierMeta } from '../../features/leaderboard/model/leaderboardData'
import { communityPosts } from '../../features/posts/model/postsData'
import { Icon } from '../../shared/ui/Icon'

const me = activityMembers.find((m) => m.isMe) ?? activityMembers[activityMembers.length - 1]

const myPosts = communityPosts.slice(0, 3)

type ProfileTab = 'overview' | 'activity' | 'posts'

export function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>('overview')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('안녕하세요! 코알라 동아리에서 백엔드와 알고리즘을 공부하고 있어요.')

  const tierMeta = solvedTierMeta[me.solvedTier]

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: '개요' },
    { id: 'activity', label: '활동 내역' },
    { id: 'posts', label: '작성 게시글' },
  ]

  return (
    <section className="coala-content coala-content--profile">
      <div className="profile-page">

        {/* Hero */}
        <div className="profile-page-hero surface-card">
          <div className="profile-page-hero-main">
            <span className="profile-page-avatar">박</span>
            <div className="profile-page-identity">
              <h2 className="profile-page-name">{profileSummary.name}</h2>
              <p className="profile-page-role">{profileSummary.role}</p>
              <p className="profile-page-joined">2024년 3월 가입 · 동아리 코알라</p>
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
            <p className="profile-stat-value">{me.rank}위</p>
            <p className="profile-stat-label">종합 순위</p>
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
              <h3 className="profile-section-title">연결된 계정</h3>
              <ul className="profile-handles-list">
                <li className="profile-handle-item">
                  <span className="profile-handle-icon profile-handle-icon--baekjoon">
                    <Icon name="file" size={14} />
                  </span>
                  <span className="profile-handle-body">
                    <span className="profile-handle-service">백준</span>
                    <span className="profile-handle-value">{me.solvedHandle}</span>
                  </span>
                </li>
                <li className="profile-handle-item">
                  <span className="profile-handle-icon profile-handle-icon--github">
                    <Icon name="network" size={14} />
                  </span>
                  <span className="profile-handle-body">
                    <span className="profile-handle-service">GitHub</span>
                    <span className="profile-handle-value">@{me.githubHandle}</span>
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
            <h3 className="profile-section-title">작성 게시글</h3>
            <ul className="profile-post-list">
              {myPosts.map((post) => (
                <li key={post.id} className="profile-post-item">
                  <div className="profile-post-body">
                    <p className="profile-post-title">{post.title}</p>
                    <p className="profile-post-excerpt">{post.excerpt}</p>
                  </div>
                  <div className="profile-post-meta">
                    <span className="profile-post-time">{post.publishedAt}</span>
                    <span className="profile-post-stat">
                      <Icon name="eye" size={11} />
                      {post.views}
                    </span>
                    <span className="profile-post-stat">
                      <Icon name="message" size={11} />
                      {post.comments}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </section>
  )
}
