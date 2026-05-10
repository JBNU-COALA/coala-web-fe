import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'
import { SearchField } from '../../shared/ui/SearchField'
import { usersApi, type ActivityMember } from '../../shared/api/users'
import { CommunityBanner } from '../community/CommunityBanner'

function getPublicUserId(member: ActivityMember, index: number, currentUserId?: number) {
  if (member.isMe && currentUserId) return String(currentUserId)
  return member.id || String(index + 1)
}

function formatAwardDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })
}

function MemberCard({ member, isSelected, onSelect }: {
  member: ActivityMember
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Link
      to={`/users/${member.id}`}
      className={isSelected ? 'activity-member-card is-active' : 'activity-member-card'}
      style={{ color: 'inherit', textDecoration: 'none' }}
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
          <span>{member.awards.length}개 수상</span>
          <span>{member.lab}</span>
        </span>
      </span>
    </Link>
  )
}

export function LeaderboardPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [labFilter, setLabFilter] = useState('all')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [members, setMembers] = useState<ActivityMember[]>([])

  const normalizedQuery = query.trim().toLowerCase()
  const gradeOptions = ['all', ...Array.from(new Set(members.map((member) => member.grade)))]
  const labOptions = ['all', ...Array.from(new Set(members.map((member) => member.lab)))]

  useEffect(() => {
    usersApi.getUsers()
      .then((items) => {
        setMembers(items)
        setSelectedMemberId(items[0]?.id ?? '')
      })
      .catch(() => setMembers([]))
  }, [])

  const filteredMembers = useMemo(() => {
    let filtered = members

    if (gradeFilter !== 'all') {
      filtered = filtered.filter((member) => member.grade === gradeFilter)
    }

    if (labFilter !== 'all') {
      filtered = filtered.filter((member) => member.lab === labFilter)
    }

    if (normalizedQuery) {
      filtered = filtered.filter((member) =>
        `${member.name} ${member.githubHandle} ${member.focus} ${member.sharedRepos.join(' ')} ${member.awards.map((award) => `${award.title} ${award.organizer} ${award.rank}`).join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
    }

    return filtered
  }, [gradeFilter, labFilter, members, normalizedQuery])

  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ?? members[0]
  const selectedMemberIndex = members.findIndex((member) => member.id === selectedMember?.id)
  const selectedUserId = selectedMember
    ? getPublicUserId(selectedMember, Math.max(selectedMemberIndex, 0), user?.id)
    : '1'

  return (
    <section className="coala-content coala-content--activity">
      <div className="activity-page activity-page--directory">
        <CommunityBanner title="유저" tone="board" />

        <div className="activity-table-shell surface-card">
          <div className="activity-table-toolbar">
            <SearchField
              className="activity-search"
              value={query}
              onChange={setQuery}
              placeholder="이름, GitHub, 저장소, 글 검색"
            />
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
                  <div className="activity-award-preview">
                    <strong>수상 내역</strong>
                    {selectedMember.awards.length > 0 ? (
                      <ul className="activity-award-list">
                        {selectedMember.awards.slice(0, 2).map((award) => (
                          <li key={award.awardId} className="activity-award-item">
                            <span className="activity-award-rank">{award.rank}</span>
                            <span className="activity-award-body">
                              <span>{award.title}</span>
                              <small>{award.organizer} · {formatAwardDate(award.awardedAt)}</small>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>등록된 수상 내역이 없습니다.</p>
                    )}
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
