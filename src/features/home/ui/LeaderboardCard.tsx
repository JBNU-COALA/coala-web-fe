import { Icon } from '../../../shared/ui/Icon'
import { leaderboardMembers } from '../model/homeData'

type LeaderboardCardProps = {
  onOpenLeaderboard?: () => void
}

export function LeaderboardCard({ onOpenLeaderboard }: LeaderboardCardProps) {
  return (
    <section className="surface-card panel leaderboard-panel">
      <header className="panel-header">
        <h2 className="panel-title">
          <Icon name="chart" size={16} />
          <span>리더보드</span>
        </h2>
        <button type="button" className="panel-action" onClick={onOpenLeaderboard}>
          전체 보기
        </button>
      </header>

      <ol className="leader-preview-list">
        {leaderboardMembers.map((member, index) => (
          <li key={member.id} className="leader-preview-item">
            <span className={`leader-avatar leader-avatar--${member.tone}`}>
              {member.initials}
            </span>

            <div>
              <p className="leader-name">{member.name}</p>
              <p className="leader-level">{member.level}</p>
            </div>

            <div className="leader-preview-score-wrap">
              <strong className="leader-score">{member.points}</strong>
              <span className="leader-rank-chip">#{index + 1}</span>
            </div>
          </li>
        ))}
      </ol>

      <footer className="leaderboard-footer">
        <span className="online-pill">10월</span>
        <span className="online-text">포인트는 24시간마다 갱신됩니다.</span>
      </footer>
    </section>
  )
}
