import { Icon } from '../../../shared/ui/Icon'
import { recruitHighlights } from '../model/homeData'

type RecruitHighlightsCardProps = {
  onOpenRecruit?: () => void
}

export function RecruitHighlightsCard({ onOpenRecruit }: RecruitHighlightsCardProps) {
  return (
    <section className="surface-card panel recruit-panel">
      <header className="panel-header">
        <h2 className="panel-title">
          <Icon name="users" size={16} />
          <span>인기 모집</span>
        </h2>
        <button type="button" className="panel-action" onClick={onOpenRecruit}>
          전체 보기
        </button>
      </header>

      <ul className="recruit-highlight-list">
        {recruitHighlights.map((item) => (
          <li key={item.id} className="recruit-highlight-item">
            <div className="recruit-highlight-head">
              <span className="recruit-highlight-category">{item.category}</span>
              <span className="recruit-highlight-deadline">{item.deadline}</span>
            </div>
            <p className="recruit-highlight-title">{item.title}</p>
            <p className="recruit-highlight-summary">{item.summary}</p>
            <p className="recruit-highlight-meta">
              <Icon name="users" size={12} />
              <span>
                {item.current}/{item.max}명 참여
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
