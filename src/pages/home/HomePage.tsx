import { portalUpdates } from '../../dummy/homeData'
import { PostCard } from './PostCard'
import { ResourcesCard } from './ResourcesCard'

type HomePageProps = {
  onOpenAllPosts?: () => void
  onOpenInfo?: () => void
}

export function HomePage({ onOpenAllPosts, onOpenInfo }: HomePageProps) {
  return (
    <section className="coala-content coala-content--portal">
      <section className="portal-hero portal-hero--slider" aria-label="홈 배너">
        <article className="portal-slide is-active">
          <div className="portal-slide-overlay" />
          <div className="portal-hero-copy">
            <h1 className="portal-hero-title">준비중입니다</h1>
          </div>
        </article>
      </section>

      <div className="portal-grid portal-grid--dashboard">
        <ResourcesCard onOpenInfo={onOpenInfo} dashboard />
        <PostCard onOpenAllPosts={onOpenAllPosts} limit={8} dashboard />
      </div>

      <section className="surface-card panel portal-updates-panel">
        <header className="panel-header">
          <div>
            <h2 className="panel-title">인기글</h2>
          </div>
          <button type="button" className="panel-action" onClick={onOpenAllPosts}>
            게시글 보기
          </button>
        </header>

        <ul className="portal-update-list">
          {portalUpdates.map((update) => (
            <li key={update.id} className="portal-update-item">
              <span className="portal-update-category">{update.category}</span>
              <div>
                <p className="portal-update-title">{update.title}</p>
                <p className="portal-update-meta">{update.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
