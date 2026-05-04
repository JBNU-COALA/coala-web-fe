import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { activityMembers, type ActivityMember } from './leaderboardData'
import { useAuth } from '../../shared/auth/AuthContext'
import { Icon } from '../../shared/ui/Icon'

function getPublicUserId(member: ActivityMember, index: number, currentUserId?: number) {
  if (member.isMe && currentUserId) return String(currentUserId)
  return String(index + 1)
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
          <span>{member.sharedRepos.length}개 저장소</span>
          <span>{member.lab}</span>
        </span>
      </span>
    </button>
  )
}

export function LeaderboardPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [labFilter, setLabFilter] = useState('all')
  const [selectedMemberId, setSelectedMemberId] = useState(activityMembers[0]?.id ?? '')

  const normalizedQuery = query.trim().toLowerCase()
  const gradeOptions = ['all', ...Array.from(new Set(activityMembers.map((member) => member.grade)))]
  const labOptions = ['all', ...Array.from(new Set(activityMembers.map((member) => member.lab)))]

  const filteredMembers = useMemo(() => {
    let members = activityMembers

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
  }, [gradeFilter, labFilter, normalizedQuery])

  const selectedMember =
    activityMembers.find((member) => member.id === selectedMemberId) ?? activityMembers[0]
  const selectedMemberIndex = activityMembers.findIndex((member) => member.id === selectedMember?.id)
  const selectedUserId = selectedMember
    ? getPublicUserId(selectedMember, Math.max(selectedMemberIndex, 0), user?.id)
    : '1'

  return (
    <section className="coala-content coala-content--activity">
      <div className="activity-page activity-page--directory">
        <div className="activity-table-shell surface-card">
          <div className="activity-table-toolbar">
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
                  </div>
                  <p className="activity-profile-focus">{selectedMember.focus}</p>
                  <div className="activity-repo-list">
                    {selectedMember.sharedRepos.map((repo) => (
                      <span key={repo}>{repo}</span>
                    ))}
                  </div>
                  <Link className="activity-profile-link" to={`/users/${selectedUserId}`}>
                    프로필 보기
                  </Link>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
