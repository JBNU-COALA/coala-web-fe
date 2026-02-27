import { Icon } from '../../../shared/ui/Icon'
import { postItems } from '../model/homeData'

type PostCardProps = {
  onOpenAllPosts?: () => void
}

export function PostCard({ onOpenAllPosts }: PostCardProps) {
  return (
    <section className="surface-card panel posts-panel">
      <header className="panel-header">
        <h2 className="panel-title">
          <Icon name="file" size={16} />
          <span>전체 게시글</span>
        </h2>
        <button type="button" className="panel-action" onClick={onOpenAllPosts}>
          전체 보기
        </button>
      </header>

      <ul className="post-list">
        {postItems.map((post) => (
          <li key={post.id} className="post-item">
            <p className="post-title">{post.title}</p>
            <p className="post-meta">
              <span>{post.timeLabel}</span>
              <span className="dot-divider" />
              <span>{post.authorRole}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

