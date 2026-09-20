import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'
import { usersApi, type ActivityMember } from '../../shared/api/users'
import { activityMembers } from '../../dummy/leaderboardData'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { ViewModeToggle, type ViewMode } from '../../shared/ui/ViewModeToggle'
import { SelectControl } from '../../shared/ui/SelectControl'
import { CommunityBanner } from '../community/CommunityBanner'

function getPublicUserId(member: ActivityMember, index: number, currentUserId?: number) {
  if (member.isMe && currentUserId) return String(currentUserId)
  return member.id || String(index + 1)
}

function MemberCard({
  member,
  profileId,
  compact = false,
}: {
  member: ActivityMember
  profileId: string
  compact?: boolean
}) {
  const profileImageUrl = resolveApiAssetUrl(member.customization?.profileImageUrl ?? '')

  return (
    <Link
      className={`activity-directory-card${compact ? ' activity-directory-card--compact' : ''}`}
      to={`/users/${profileId}`}
      aria-label={`${member.name} 프로필`}
    >
      <header className="activity-directory-card-head">
        <CharacterAvatar
          name={member.name}
          seed={member.id || member.name}
          src={profileImageUrl}
          size={compact ? 'md' : 'lg'}
        />
        <div>
          <strong className="activity-member-name">
            {member.name}
            {member.isMe ? <span className="activity-you-chip">나</span> : null}
          </strong>
          <span className="activity-member-handles">@{member.githubHandle}</span>
        </div>
      </header>

      <p className="activity-member-focus">{member.focus}</p>
      <div className="activity-profile-meta">
        <span>{member.role}</span>
        <span>{member.grade}</span>
        <span>{member.lab}</span>
      </div>
      <div className="activity-repo-list">
        {member.sharedRepos.slice(0, 3).map((repo) => <span key={repo}>{repo}</span>)}
      </div>

      <footer className="activity-directory-card-footer">
        <span><Icon name="link" size={14} /> @{member.githubHandle}</span>
        <span><Icon name="network" size={14} /> 프로젝트 {member.sharedRepos.length}</span>
        <span><Icon name="chart" size={14} /> 수상 {member.awards.length}</span>
        <Icon name="chevron-right" size={15} />
      </footer>
    </Link>
  )
}

export function LeaderboardPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [labFilter, setLabFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [members, setMembers] = useState<ActivityMember[]>([])

  const normalizedQuery = query.trim().toLowerCase()
  const gradeOptions = ['all', ...Array.from(new Set(members.map((member) => member.grade)))]
  const labOptions = ['all', ...Array.from(new Set(members.map((member) => member.lab)))]

  useEffect(() => {
    usersApi.getUsers()
      .then((items) => setMembers(items.length > 0 ? items : activityMembers))
      .catch(() => setMembers(activityMembers))
  }, [])

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (gradeFilter !== 'all' && member.grade !== gradeFilter) return false
      if (labFilter !== 'all' && member.lab !== labFilter) return false
      if (!normalizedQuery) return true

      const awards = member.awards.map((award) => `${award.title} ${award.organizer} ${award.rank}`).join(' ')
      return `${member.name} ${member.githubHandle} ${member.focus} ${member.sharedRepos.join(' ')} ${awards}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [gradeFilter, labFilter, members, normalizedQuery])

  return (
    <section className="coala-content coala-content--activity">
      <div className="activity-page activity-page--directory">
        <CommunityBanner title="유저" description="함께 만드는 코알라 멤버" tone="users" />

        <div className="activity-table-shell">
          <section className="activity-directory-controls" aria-label="유저 검색 및 필터">
            <strong className="activity-member-count">멤버 {filteredMembers.length}명</strong>
            <SearchField
              className="activity-search"
              value={query}
              onChange={setQuery}
              placeholder="이름, 기술, 프로젝트 검색"
            />
            <SelectControl
              className="activity-select-control"
              label="학년"
              value={gradeFilter}
              options={gradeOptions.map((grade) => ({ value: grade, label: grade === 'all' ? '학년 전체' : grade }))}
              onChange={setGradeFilter}
            />
            <SelectControl
              className="activity-select-control"
              label="연구실"
              value={labFilter}
              options={labOptions.map((lab) => ({ value: lab, label: lab === 'all' ? '연구실 전체' : lab }))}
              onChange={setLabFilter}
            />
            <ViewModeToggle value={viewMode} onChange={setViewMode} className="activity-view-toggle" />
          </section>

          {filteredMembers.length > 0 ? (
            <section className="activity-recent-members" aria-label="최근 활동 유저">
              <header className="activity-directory-section-head">
                <div><h2>최근 활동한 멤버</h2><p>최근에 활동한 코알라 멤버입니다.</p></div>
                <a href="#all-members">전체 보기 <Icon name="chevron-right" size={14} /></a>
              </header>
              <div className="activity-recent-grid">
                {filteredMembers.slice(0, 3).map((member, index) => (
                  <MemberCard
                    key={`recent-${member.id}`}
                    member={member}
                    compact
                    profileId={getPublicUserId(member, members.indexOf(member) >= 0 ? members.indexOf(member) : index, user?.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <header id="all-members" className="activity-directory-section-head activity-directory-section-head--all">
            <div><h2>전체 멤버</h2><p>코알라와 함께하는 멤버를 확인할 수 있습니다.</p></div>
          </header>
          <section className={`activity-directory-grid activity-directory-grid--${viewMode}`} aria-label="전체 유저 목록">
            {filteredMembers.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                profileId={getPublicUserId(member, members.indexOf(member) >= 0 ? members.indexOf(member) : index, user?.id)}
              />
            ))}
          </section>
          {filteredMembers.length === 0 ? <p className="activity-empty">조건에 맞는 유저가 없습니다.</p> : null}
        </div>
      </div>
    </section>
  )
}
