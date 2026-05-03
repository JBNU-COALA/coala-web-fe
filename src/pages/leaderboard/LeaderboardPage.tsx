import { useMemo, useState } from 'react'
import { activityMembers, type ActivityLogType, type ActivityMember } from './leaderboardData'
import { Icon } from '../../shared/ui/Icon'

type ActivityTab = 'users' | 'github' | 'mine'

const logIconByType: Record<ActivityLogType, Parameters<typeof Icon>[0]['name']> = {
  commit: 'network',
  'pull-request': 'link',
  release: 'file',
  note: 'book',
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
      </span>
    </button>
  )
}

export function LeaderboardPage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<ActivityTab>('users')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [labFilter, setLabFilter] = useState('all')
  const [selectedMemberId, setSelectedMemberId] = useState(activityMembers[0]?.id ?? '')

  const normalizedQuery = query.trim().toLowerCase()
  const gradeOptions = ['all', ...Array.from(new Set(activityMembers.map((member) => member.grade)))]
  const labOptions = ['all', ...Array.from(new Set(activityMembers.map((member) => member.lab)))]

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

  const visibleLogs = useMemo(() => {
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
    if (tab === 'mine') return logs.filter((log) => log.githubHandle === activityMembers.find((m) => m.isMe)?.githubHandle)
    return selectedMember?.logs ?? []
  }, [selectedMember, tab])

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
            <h2 className="activity-page-title">활동</h2>
            <p className="activity-page-subtitle">
              유저가 공유한 GitHub 저장소와 최근 활동 로그를 확인합니다.
            </p>
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
                  onClick={() => setTab(item.id)}
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
                placeholder="이름, GitHub, 저장소 검색"
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
                      <p>@{selectedMember.githubHandle}</p>
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
                        {log.repository} · {log.timeLabel}
                        {'memberName' in log ? ` · ${log.memberName}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
