import { useMemo, useState } from 'react'
import {
  activityMembers,
  GITHUB_COMMIT_POINT,
  type ActivityMember,
} from './leaderboardData'
import { Icon } from '../../shared/ui/Icon'

type TabId = 'overall' | 'github' | 'opensource' | 'me'

const trendSymbol: Record<'up' | 'down' | 'flat', string> = {
  up: '▲',
  down: '▼',
  flat: '―',
}

const podiumOrder = [1, 0, 2]

const activitySourceCards = [
  {
    id: 'github',
    label: 'GitHub 활동',
    description: '커밋, 리뷰, 프로젝트 기여를 중심으로 활동 기록을 정리합니다.',
    pointFormula: `커밋 1회 = ${GITHUB_COMMIT_POINT}pt`,
  },
  {
    id: 'community',
    label: '개발자 커뮤니티',
    description: '기술 질문 답변, 자료 공유, 코드 리뷰 참여도를 함께 반영합니다.',
    pointFormula: '답변 1건 = 12pt · 리뷰 1건 = 15pt',
  },
  {
    id: 'opensource',
    label: '오픈소스 기여',
    description: '이슈 제보, 문서 개선, PR 제출 이력을 활동 지표로 묶습니다.',
    pointFormula: 'PR 1건 = 40pt · 이슈 1건 = 10pt',
  },
]

function getGithubPoints(row: ActivityMember) {
  return row.githubCommits * GITHUB_COMMIT_POINT
}

function getCommunityStats(row: ActivityMember) {
  return {
    answers: Math.max(2, Math.round(row.githubCommits / 18)),
    reviews: Math.max(1, Math.round(row.githubCommits / 32)),
    shares: Math.max(1, row.rank <= 3 ? 6 - row.rank : 2),
  }
}

function getOpenSourceStats(row: ActivityMember) {
  return {
    prs: Math.max(0, Math.round(row.githubCommits / 70)),
    issues: Math.max(1, Math.round(row.githubCommits / 45)),
  }
}

function getActivityPoints(row: ActivityMember) {
  const community = getCommunityStats(row)
  const openSource = getOpenSourceStats(row)
  return (
    getGithubPoints(row) +
    community.answers * 12 +
    community.reviews * 15 +
    community.shares * 8 +
    openSource.prs * 40 +
    openSource.issues * 10
  )
}

function ActivityRow({ row }: { row: ActivityMember }) {
  const isTop3 = row.rank <= 3
  return (
    <li
      className={[
        'activity-row',
        row.isMe ? 'activity-row--me' : '',
        isTop3 ? `activity-row--top${row.rank}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="row"
    >
      <span className="activity-cell activity-cell--rank" role="cell">
        {isTop3 ? (
          <span className={`rank-medal rank-medal--${row.rank}`}>{row.rank}</span>
        ) : (
          <span className="rank-number">{row.rank}</span>
        )}
      </span>

      <span className="activity-cell activity-cell--member" role="cell">
        <span className={`activity-avatar activity-avatar--${row.tone}`}>{row.initials}</span>
        <span className="activity-member-info">
          <span className="activity-member-name">
            {row.name}
            {row.isMe ? <span className="activity-you-chip">나</span> : null}
          </span>
          <span className="activity-member-handles">@{row.githubHandle}</span>
        </span>
      </span>

      <span className="activity-cell activity-cell--commits" role="cell">
        <span className="activity-commits-count">{row.githubCommits}</span>
        <span className="activity-commits-label">commits</span>
      </span>

      <span className="activity-cell activity-cell--opensource" role="cell">
        <span className="activity-open-source-placeholder">
          답변 {getCommunityStats(row).answers} · 리뷰 {getCommunityStats(row).reviews}
        </span>
      </span>

      <span className="activity-cell activity-cell--points" role="cell">
        <strong className="activity-total-points">{getActivityPoints(row).toLocaleString()}</strong>
        <span className="activity-points-label">pts</span>
      </span>

      <span
        className={`activity-cell activity-cell--trend trend-chip trend-chip--${row.trend}`}
        role="cell"
      >
        {trendSymbol[row.trend]}
      </span>
    </li>
  )
}

export function LeaderboardPage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabId>('overall')

  const normalizedQuery = query.trim().toLowerCase()

  const top3 = useMemo(
    () => activityMembers.filter((m) => m.rank <= 3).sort((a, b) => a.rank - b.rank),
    [],
  )

  const tableRows = useMemo(() => {
    let rows = activityMembers

    if (tab === 'me') {
      rows = rows.filter((r) => r.isMe)
    }

    if (tab === 'github') {
      rows = [...rows].sort((a, b) => b.githubCommits - a.githubCommits)
    }

    if (tab === 'opensource') {
      rows = [...rows].sort((a, b) => {
        const aStats = getOpenSourceStats(a)
        const bStats = getOpenSourceStats(b)
        return bStats.prs + bStats.issues - (aStats.prs + aStats.issues)
      })
    }

    if (normalizedQuery) {
      rows = rows.filter((r) =>
        `${r.name} ${r.githubHandle}`.toLowerCase().includes(normalizedQuery),
      )
    }

    return rows
  }, [tab, normalizedQuery])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overall', label: '전체' },
    { id: 'github', label: 'GitHub' },
    { id: 'opensource', label: '오픈소스/커뮤니티' },
    { id: 'me', label: '내 활동' },
  ]

  return (
    <section className="coala-content coala-content--activity">
      <div className="activity-page">
        <header className="activity-page-header">
          <div className="activity-page-title-block">
            <p className="activity-page-eyebrow">2026 · 2월</p>
            <h2 className="activity-page-title">활동 현황</h2>
            <p className="activity-page-subtitle">
              GitHub, 코드 리뷰, 질의응답, 자료 공유, 오픈소스 참여 흐름을 함께 보여줍니다.
            </p>
          </div>
          <div className="activity-page-header-actions">
            <button type="button" className="activity-header-button">
              <Icon name="file" size={14} />
              리포트
            </button>
          </div>
        </header>

        <div className="activity-sources-grid">
          {activitySourceCards.map((source) => (
            <div key={source.id} className="activity-source-card surface-card">
              <div className="activity-source-icon">
                <Icon
                  name={source.id === 'github' ? 'network' : source.id === 'community' ? 'message' : 'link'}
                  size={18}
                />
              </div>
              <div className="activity-source-body">
                <p className="activity-source-label">{source.label}</p>
                <p className="activity-source-desc">{source.description}</p>
                <p className="activity-source-formula">{source.pointFormula}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="activity-podium" aria-label="상위 활동 멤버">
          {podiumOrder.map((idx) => {
            const member = top3[idx]
            if (!member) return null
            const activityPts = getActivityPoints(member)
            return (
              <div
                key={member.id}
                className={`podium-slot podium-slot--${member.rank}`}
              >
                <div className="podium-card">
                  <span className={`podium-avatar podium-avatar--${member.tone}`}>
                    {member.initials}
                  </span>
                  <span className={`podium-rank-badge podium-rank-badge--${member.rank}`}>
                    {member.rank}
                  </span>
                  <p className="podium-name">{member.name}</p>
                  <p className="podium-handle">@{member.githubHandle}</p>
                  <p className="podium-points">{activityPts.toLocaleString()} pts</p>
                  <div className="podium-breakdown">
                    <span className="podium-breakdown-item">
                      <span className="podium-breakdown-dot podium-breakdown-dot--github" />
                      GitHub {member.githubCommits}회
                    </span>
                    <span className="podium-breakdown-item">
                      <span className="podium-breakdown-dot podium-breakdown-dot--community" />
                      답변 {getCommunityStats(member).answers}건
                    </span>
                  </div>
                </div>
                <div className={`podium-pedestal podium-pedestal--${member.rank}`} />
              </div>
            )
          })}
        </div>

        <div className="activity-table-shell surface-card">
          <div className="activity-table-toolbar">
            <div className="activity-tabs">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={tab === t.id ? 'activity-tab is-active' : 'activity-tab'}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label className="activity-search">
              <Icon name="search" size={14} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 또는 GitHub 핸들 검색"
              />
            </label>
          </div>

          <div className="activity-table-wrap" role="table" aria-label="활동 현황 테이블">
            <div className="activity-table-head" role="row">
              <span role="columnheader">순위</span>
              <span role="columnheader">멤버</span>
              <span role="columnheader">GitHub</span>
              <span role="columnheader">커뮤니티</span>
              <span role="columnheader">포인트</span>
              <span role="columnheader">추세</span>
            </div>

            <ul className="activity-table-body">
              {tableRows.map((row) => (
                <ActivityRow key={row.id} row={row} />
              ))}
              {tableRows.length === 0 ? (
                <li className="activity-empty">
                  조건에 맞는 멤버가 없습니다.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
