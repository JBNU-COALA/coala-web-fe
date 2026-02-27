import { useMemo, useState } from 'react'
import {
  activityMembers,
  activitySources,
  solvedTierMeta,
  GITHUB_COMMIT_POINT,
  type ActivityMember,
  type SolvedTier,
} from '../../features/leaderboard/model/leaderboardData'
import { Icon } from '../../shared/ui/Icon'

type TabId = 'overall' | 'baekjoon' | 'github' | 'me'

const trendSymbol: Record<'up' | 'down' | 'flat', string> = {
  up: '▲',
  down: '▼',
  flat: '―',
}

const podiumOrder = [1, 0, 2] // 2nd, 1st, 3rd visually

function SolvedTierBadge({ tier }: { tier: SolvedTier }) {
  const meta = solvedTierMeta[tier]
  return <span className={`solved-tier-badge solved-tier-badge--${tier}`}>{meta.label}</span>
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
          <span className="activity-member-handles">
            {row.solvedHandle} · @{row.githubHandle}
          </span>
        </span>
      </span>

      <span className="activity-cell activity-cell--tier" role="cell">
        <SolvedTierBadge tier={row.solvedTier} />
        <span className="activity-solved-count">{row.solvedCount}문제</span>
      </span>

      <span className="activity-cell activity-cell--commits" role="cell">
        <span className="activity-commits-count">{row.githubCommits}</span>
        <span className="activity-commits-label">commits</span>
      </span>

      <span className="activity-cell activity-cell--points" role="cell">
        <strong className="activity-total-points">
          {row.totalPoints.toLocaleString()}
        </strong>
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

    if (tab === 'baekjoon') {
      rows = [...rows].sort((a, b) => {
        const tierOrder: SolvedTier[] = ['ruby', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'unrated']
        const tierDiff = tierOrder.indexOf(a.solvedTier) - tierOrder.indexOf(b.solvedTier)
        if (tierDiff !== 0) return tierDiff
        return b.solvedCount - a.solvedCount
      })
    }

    if (tab === 'github') {
      rows = [...rows].sort((a, b) => b.githubCommits - a.githubCommits)
    }

    if (normalizedQuery) {
      rows = rows.filter((r) =>
        `${r.name} ${r.solvedHandle} ${r.githubHandle}`.toLowerCase().includes(normalizedQuery),
      )
    }

    return rows
  }, [tab, normalizedQuery])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overall', label: '종합 순위' },
    { id: 'baekjoon', label: '백준' },
    { id: 'github', label: 'GitHub' },
    { id: 'me', label: '내 순위' },
  ]

  return (
    <section className="coala-content coala-content--activity">
      <div className="activity-page">
        {/* Page header */}
        <header className="activity-page-header">
          <div className="activity-page-title-block">
            <p className="activity-page-eyebrow">2026 · 2월</p>
            <h2 className="activity-page-title">활동 랭킹</h2>
            <p className="activity-page-subtitle">
              백준 문제풀이와 GitHub 커밋 기록을 합산한 종합 활동 순위입니다. 포인트는 24시간마다 업데이트됩니다.
            </p>
          </div>
          <div className="activity-page-header-actions">
            <button type="button" className="activity-header-button">
              <Icon name="file" size={14} />
              리포트
            </button>
          </div>
        </header>

        {/* Activity sources */}
        <div className="activity-sources-grid">
          {activitySources.map((source) => (
            <div key={source.id} className="activity-source-card surface-card">
              <div className="activity-source-icon">
                <Icon name={source.id === 'baekjoon' ? 'file' : 'network'} size={18} />
              </div>
              <div className="activity-source-body">
                <p className="activity-source-label">{source.label}</p>
                <p className="activity-source-desc">{source.description}</p>
                <p className="activity-source-formula">{source.pointFormula}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Podium */}
        <div className="activity-podium" aria-label="상위 랭커">
          {podiumOrder.map((idx) => {
            const member = top3[idx]
            if (!member) return null
            const baekjoonPts = member.solvedCount * solvedTierMeta[member.solvedTier].pointsPerProblem
            const githubPts = member.githubCommits * GITHUB_COMMIT_POINT
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
                  <SolvedTierBadge tier={member.solvedTier} />
                  <p className="podium-points">{member.totalPoints.toLocaleString()} pts</p>
                  <div className="podium-breakdown">
                    <span className="podium-breakdown-item">
                      <span className="podium-breakdown-dot podium-breakdown-dot--baekjoon" />
                      {baekjoonPts.toLocaleString()}
                    </span>
                    <span className="podium-breakdown-sep">+</span>
                    <span className="podium-breakdown-item">
                      <span className="podium-breakdown-dot podium-breakdown-dot--github" />
                      {githubPts.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className={`podium-pedestal podium-pedestal--${member.rank}`} />
              </div>
            )
          })}
        </div>

        {/* Table section */}
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
                placeholder="이름 또는 핸들 검색"
              />
            </label>
          </div>

          <div className="activity-table-wrap" role="table" aria-label="활동 랭킹 테이블">
            <div className="activity-table-head" role="row">
              <span role="columnheader">순위</span>
              <span role="columnheader">멤버</span>
              <span role="columnheader">백준</span>
              <span role="columnheader">GitHub</span>
              <span role="columnheader">총 포인트</span>
              <span role="columnheader">추세</span>
            </div>

            <ul className="activity-table-body">
              {tableRows.map((row) => (
                <ActivityRow key={row.id} row={row} />
              ))}
              {tableRows.length === 0 ? (
                <li className="activity-empty">조건에 맞는 멤버가 없습니다.</li>
              ) : null}
            </ul>
          </div>
        </div>

        {/* Point formula reference */}
        <div className="activity-formula-strip">
          <p className="activity-formula-title">포인트 산정 기준</p>
          <div className="activity-formula-tiers">
            {(Object.entries(solvedTierMeta) as [SolvedTier, { label: string; pointsPerProblem: number }][]).map(
              ([tier, meta]) => (
                <span key={tier} className="activity-formula-tier-item">
                  <span className={`solved-tier-badge solved-tier-badge--${tier}`}>{meta.label}</span>
                  <span className="activity-formula-pt">{meta.pointsPerProblem}pt</span>
                </span>
              ),
            )}
            <span className="activity-formula-divider" />
            <span className="activity-formula-tier-item">
              <Icon name="network" size={13} />
              <span className="activity-formula-pt">커밋 {GITHUB_COMMIT_POINT}pt</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
