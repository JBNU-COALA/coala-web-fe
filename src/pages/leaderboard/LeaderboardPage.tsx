import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { activityMembers, type ActivityLog, type ActivityLogType, type ActivityMember } from './leaderboardData'
import { communityPosts } from '../../data/postsData'
import { resourceCards } from '../../data/infoData'
import { recruitItems } from '../../data/recruitData'
import { useAuth } from '../../shared/auth/AuthContext'
import { Icon } from '../../shared/ui/Icon'

type ActivityTab = 'users' | 'github' | 'mine'
type VisibleActivityLog = ActivityLog & {
  memberName?: string
  githubHandle?: string
  tone?: ActivityMember['tone']
  initials?: string
}
type MyActivityPost = {
  id: string
  type: '게시판' | '정보공유' | '모집'
  title: string
  description: string
  meta: string
  path: string
}

const logIconByType: Record<ActivityLogType, Parameters<typeof Icon>[0]['name']> = {
  commit: 'network',
  'pull-request': 'link',
  release: 'file',
  note: 'book',
}

const getActivityTabFromParam = (tab: string | null): ActivityTab => {
  if (tab === 'github' || tab === 'mine') return tab
  return 'users'
}

function MemberCard({ member, isSelected, onSelect }: {
  member: ActivityMember
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={isSelected ? 'activity-member-card is-active' : 'activity-member-card'}
      onClick={onSelect}
    >
      <span className={`activity-avatar activity-avatar--${member.tone}`}>{member.initials}</span>
      <span className="activity-member-info">
        <span className="activity-member-name">
          {member.name}
          {member.isMe ? <span className="activity-you-chip">나</span> : null}
        </span>
        <span className="activity-member-handles">@{member.githubHandle}</span>
        <span className="activity-member-focus">{member.focus}</span>
        <span className="activity-member-meta-line">
          {member.role} · {member.grade}
        </span>
        <span className="activity-member-metrics">
          <span>{member.sharedRepos.length} repos</span>
          <span>{member.githubCommits} commits</span>
        </span>
      </span>
    </button>
  )
}

export function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<ActivityTab>(() => getActivityTabFromParam(searchParams.get('tab')))
  const [gradeFilter, setGradeFilter] = useState('all')
  const [labFilter, setLabFilter] = useState('all')
  const [selectedMemberId, setSelectedMemberId] = useState(activityMembers[0]?.id ?? '')

  const normalizedQuery = query.trim().toLowerCase()
  const gradeOptions = ['all', ...Array.from(new Set(activityMembers.map((member) => member.grade)))]
  const labOptions = ['all', ...Array.from(new Set(activityMembers.map((member) => member.lab)))]
  const activityStats = useMemo(() => {
    const repositories = new Set(activityMembers.flatMap((member) => member.sharedRepos))
    const commits = activityMembers.reduce((total, member) => total + member.githubCommits, 0)

    return [
      { label: 'members', value: activityMembers.length },
      { label: 'repos', value: repositories.size },
      { label: 'commits', value: commits },
    ]
  }, [])

  const filteredMembers = useMemo(() => {
    let members = activityMembers

    if (tab === 'mine') {
      members = members.filter((member) => member.isMe)
    }

    if (gradeFilter !== 'all') {
      members = members.filter((member) => member.grade === gradeFilter)
    }

    if (labFilter !== 'all') {
      members = members.filter((member) => member.lab === labFilter)
    }

    if (normalizedQuery) {
      members = members.filter((member) =>
        `${member.name} ${member.githubHandle} ${member.focus} ${member.sharedRepos.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    }

    return members
  }, [gradeFilter, labFilter, normalizedQuery, tab])

  const selectedMember =
    activityMembers.find((member) => member.id === selectedMemberId) ?? activityMembers[0]
  const defaultMe = activityMembers.find((member) => member.isMe) ?? activityMembers[0]
  const myActivityName = user?.name?.trim() || defaultMe?.name || ''

  useEffect(() => {
    setTab(getActivityTabFromParam(searchParams.get('tab')))
  }, [searchParams])

  const changeTab = (nextTab: ActivityTab) => {
    setTab(nextTab)
    setSearchParams(nextTab === 'users' ? {} : { tab: nextTab })
  }

  const visibleLogs = useMemo<VisibleActivityLog[]>(() => {
    const logs = activityMembers.flatMap((member) =>
      member.logs.map((log) => ({
        ...log,
        memberName: member.name,
        githubHandle: member.githubHandle,
        tone: member.tone,
        initials: member.initials,
      })),
    )

    if (tab === 'github') return logs
    if (tab === 'mine') return []
    return selectedMember?.logs ?? []
  }, [selectedMember, tab])

  const myWrittenPosts = useMemo<MyActivityPost[]>(() => {
    const boardPosts = communityPosts
      .filter((post) => post.author === myActivityName)
      .map((post) => ({
        id: `board-${post.id}`,
        type: '게시판' as const,
        title: post.title,
        description: post.excerpt,
        meta: `${post.publishedAt} · 댓글 ${post.comments}`,
        path: `/community/board/posts/${post.id}`,
      }))

    const infoPosts = resourceCards
      .filter((card) => card.source.split('|')[0]?.trim() === myActivityName)
      .map((card) => ({
        id: `info-${card.id}`,
        type: '정보공유' as const,
        title: card.title,
        description: card.source,
        meta: card.meta,
        path: '/community/info',
      }))

    const recruitPosts = recruitItems
      .filter((item) => item.host === myActivityName)
      .map((item) => ({
        id: `recruit-${item.id}`,
        type: '모집' as const,
        title: item.title,
        description: item.shortDesc,
        meta: `${item.createdAt} · ${item.currentMembers}/${item.maxMembers}명`,
        path: `/community/recruit/${item.id}`,
      }))

    const posts = [...boardPosts, ...infoPosts, ...recruitPosts]

    if (!normalizedQuery) return posts
    return posts.filter((post) =>
      `${post.type} ${post.title} ${post.description} ${post.meta}`.toLowerCase().includes(normalizedQuery),
    )
  }, [myActivityName, normalizedQuery])

  const tabs: { id: ActivityTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { id: 'users', label: '유저 목록', icon: 'users' },
    { id: 'github', label: 'GitHub 활동', icon: 'network' },
    { id: 'mine', label: '내 활동', icon: 'user' },
  ]

  return (
    <section className="coala-content coala-content--activity">
      <div className="activity-page activity-page--directory">
        <header className="activity-page-header">
          <div className="activity-page-title-block">
            <h2 className="activity-page-title">개발자 활동</h2>
            <p className="activity-page-subtitle">
              부원들이 공유한 GitHub 저장소, 관심 기술, 최근 개발 로그를 모아봅니다.
            </p>
          </div>
          <div className="activity-dev-stats" aria-label="활동 요약">
            {activityStats.map((item) => (
              <span key={item.label} className="activity-dev-stat">
                <strong>{item.value}</strong>
                <small>{item.label}</small>
              </span>
            ))}
          </div>
        </header>

        <div className="activity-table-shell surface-card">
          <div className="activity-table-toolbar">
            <div className="activity-tabs">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={tab === item.id ? 'activity-tab is-active' : 'activity-tab'}
                  onClick={() => changeTab(item.id)}
                >
                  <Icon name={item.icon} size={14} />
                  {item.label}
                </button>
              ))}
            </div>

            <label className="activity-search">
              <Icon name="search" size={14} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="이름, GitHub, 저장소, 글 검색"
              />
            </label>
          </div>

          <div className="activity-filter-row">
            <label>
              <span>학년</span>
              <select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)}>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade === 'all' ? '전체' : grade}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>연구실</span>
              <select value={labFilter} onChange={(event) => setLabFilter(event.target.value)}>
                {labOptions.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab === 'all' ? '전체' : lab}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="activity-directory-layout">
            <aside className="activity-member-list" aria-label="유저 목록">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isSelected={selectedMember?.id === member.id}
                  onSelect={() => setSelectedMemberId(member.id)}
                />
              ))}
              {filteredMembers.length === 0 ? (
                <p className="activity-empty">조건에 맞는 유저가 없습니다.</p>
              ) : null}
            </aside>

            <section className="activity-detail-panel">
              {selectedMember ? (
                <div className="activity-profile-card">
                  <div className="activity-profile-head">
                    <span className={`activity-avatar activity-avatar--${selectedMember.tone}`}>
                      {selectedMember.initials}
                    </span>
                    <div>
                      <h3>{selectedMember.name}</h3>
                      <a href={selectedMember.githubUrl} target="_blank" rel="noreferrer">
                        @{selectedMember.githubHandle}
                      </a>
                    </div>
                  </div>
                  <div className="activity-profile-meta">
                    <span>{selectedMember.role}</span>
                    <span>{selectedMember.grade}</span>
                    <span>{selectedMember.lab}</span>
                    <span>{selectedMember.recentCommit}</span>
                  </div>
                  <div className="activity-repo-list">
                    {selectedMember.sharedRepos.map((repo) => (
                      <span key={repo}>{repo}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="activity-feed-heading">
                <span>
                  {tab === 'github' ? 'GitHub feed' : tab === 'mine' ? 'My posts' : 'Selected feed'}
                </span>
                <strong>{tab === 'mine' ? myWrittenPosts.length : visibleLogs.length}</strong>
              </div>

              {tab === 'mine' ? (
                <ul className="activity-post-list">
                  {myWrittenPosts.map((post) => (
                    <li key={post.id} className="activity-post-item">
                      <span className="activity-post-type">{post.type}</span>
                      <div>
                        <Link to={post.path} className="activity-post-title">{post.title}</Link>
                        <p>{post.description}</p>
                        <span>{post.meta}</span>
                      </div>
                    </li>
                  ))}
                  {myWrittenPosts.length === 0 ? (
                    <li className="activity-empty">작성한 글이 없습니다.</li>
                  ) : null}
                </ul>
              ) : (
                <ul className="activity-log-list">
                  {visibleLogs.map((log) => (
                    <li key={log.id} className="activity-log-item">
                      <span className="activity-log-icon">
                        <Icon name={logIconByType[log.type]} size={15} />
                      </span>
                      <div>
                        <p className="activity-log-title">{log.title}</p>
                        <p className="activity-log-description">{log.description}</p>
                        <p className="activity-log-meta">
                          <span>{log.repository}</span>
                          <span>{log.timeLabel}</span>
                          {'memberName' in log ? <span>{log.memberName}</span> : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
