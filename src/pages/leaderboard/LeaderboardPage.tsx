import { LoadErrorState } from '../../shared/ui/LoadErrorState'
import { ListingControls } from '../../shared/ui/ListingControls'
import { loadRecentAttendanceRecords } from '../../shared/activityRepository'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'
import { usersApi, type ActivityMember } from '../../shared/api/users'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { ViewModeToggle, type ViewMode } from '../../shared/ui/ViewModeToggle'
import { SelectControl } from '../../shared/ui/SelectControl'
import { CommunityBanner } from '../community/CommunityBanner'
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner'
import './directory.css'

function getPublicUserId(member: ActivityMember, currentUserId?: number) {
  if (member.isMe && currentUserId) return String(currentUserId)
  return member.id
}

function MemberCard({
  member,
  profileId,
}: {
  member: ActivityMember
  profileId: string
}) {
  const profileImageUrl = resolveApiAssetUrl(member.customization?.profileImageUrl ?? '')

  return (
    <Link
      className="activity-directory-card"
      to={`/users/${profileId}`}
      aria-label={`${member.name} 프로필`}
    >
      <header className="activity-directory-card-head">
        <CharacterAvatar
          name={member.name}
          seed={member.id || member.name}
          src={profileImageUrl}
          size="lg"
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
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadRevision, setLoadRevision] = useState(0)
  const [members, setMembers] = useState<ActivityMember[]>([])

  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({})
  const [attendanceState, setAttendanceState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    const controller = new AbortController()
    loadRecentAttendanceRecords(controller.signal).then((records) => {
      if (controller.signal.aborted) return
      const counts: Record<string, number> = {}
      for (const record of records) {
        const attended = new Set(record.attendance.filter((entry) => entry.status === 'present').map((entry) => String(entry.userId)))
        for (const id of attended) counts[id] = (counts[id] ?? 0) + 1
      }
      setAttendanceCounts(counts)
      setAttendanceState('ready')
    }).catch(() => { if (!controller.signal.aborted) setAttendanceState('error') })
    return () => controller.abort()
  }, [loadRevision, user?.id])

  const normalizedQuery = query.trim().toLowerCase()
  const gradeOptions = ['all', ...Array.from(new Set(members.map((member) => member.grade)))
    .sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }))]
  const labOptions = ['all', ...Array.from(new Set(members.map((member) => member.lab)))
    .sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }))]

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) { setIsLoading(true); setLoadError('') }
      return usersApi.getUsers()
    }).then((items) => { if (active) setMembers(items) })
      .catch(() => { if (active) { setMembers([]); setLoadError('유저 목록을 불러오지 못했습니다.') } })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [loadRevision, user?.id])

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

  const attendanceLeaders = [...filteredMembers]
    .filter((member) => (attendanceCounts[getPublicUserId(member, user?.id)] ?? 0) > 0)
    .sort((a, b) => (attendanceCounts[getPublicUserId(b, user?.id)] ?? 0) - (attendanceCounts[getPublicUserId(a, user?.id)] ?? 0) || a.name.localeCompare(b.name, 'ko'))
    .slice(0, 3)

  return (
    <section className="coala-content coala-content--activity">
      <div className="activity-page activity-page--directory">
        <CommunityBanner title="유저" description="함께 만드는 코알라 멤버" tone="users" />

        <div className="activity-table-shell">
          <ListingControls search={<SearchField
              className="activity-search"
              value={query}
              onChange={setQuery}
              placeholder="이름, 기술, 프로젝트 검색"
            />} label="유저 검색 및 필터" actions={<ViewModeToggle value={viewMode} onChange={setViewMode} className="activity-view-toggle" />}>

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
            </ListingControls>
          {loadError && <LoadErrorState message={loadError} onRetry={() => setLoadRevision((value) => value + 1)} />}

          {!isLoading && !loadError && filteredMembers.length > 0 ? (
            <section className="activity-recent-members" aria-label="출석 우수 멤버">
              <header className="activity-directory-section-head">
                <div><h2><span aria-hidden="true">👑</span> 출석 우수 멤버</h2><p>최근 30일간 출석 기록이 많은 멤버입니다.</p></div>
                <a href="#all-members">전체 보기 <Icon name="chevron-right" size={14} /></a>
              </header>
              {attendanceState === 'loading' ? <LoadingSpinner label="출석 현황을 불러오는 중입니다." />
                : attendanceState === 'error' ? <p className="activity-empty">출석 현황을 불러오지 못했습니다.</p>
                  : attendanceLeaders.length === 0 ? <p className="activity-empty">최근 30일간 확인된 출석 기록이 없습니다.</p> : null}
              <div className={`activity-directory-grid activity-directory-grid--${viewMode}`}>
                {attendanceLeaders.map((member) => (
                  <MemberCard
                    key={`recent-${member.id}`}
                    member={member}
                    profileId={getPublicUserId(member, user?.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {!isLoading && !loadError && <><header id="all-members" className="activity-directory-section-head activity-directory-section-head--all">
            <div><h2><Icon name="profile-color" size={23} /> 전체 멤버</h2><p>코알라와 함께하는 멤버를 확인할 수 있습니다.</p></div>
            <strong className="activity-member-count">{isLoading || loadError ? '멤버' : `멤버 ${filteredMembers.length}명`}</strong>
          </header>
          <section className={`activity-directory-grid activity-directory-grid--${viewMode}`} aria-label="전체 유저 목록">
            {!isLoading && !loadError && filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                profileId={getPublicUserId(member, user?.id)}
              />
            ))}
          </section></>}
          {isLoading ? <LoadingSpinner label="유저 목록을 불러오는 중입니다." />
            : !loadError && filteredMembers.length === 0 ? <p className="activity-empty">조건에 맞는 유저가 없습니다.</p> : null}
        </div>
      </div>
    </section>
  )
}
