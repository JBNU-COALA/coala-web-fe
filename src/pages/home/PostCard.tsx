import { useEffect, useState } from 'react'
import { boardsApi } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { Icon } from '../../shared/ui/Icon'
import { communityPosts, postCategoryMeta } from '../../dummy/postsData'

type PostCardProps = {
  onOpenAllPosts?: () => void
  limit?: number
  dashboard?: boolean
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

const fallbackPosts: PostListItem[] = communityPosts.map((post, index) => ({
  postId: index + 1,
  boardId: index + 1,
  boardName: postCategoryMeta[post.category].label,
  userId: index + 1,
  authorName: post.author,
  title: post.title,
  content: post.excerpt,
  viewCount: Number(post.views.replace('k', '00').replace('.', '')),
  createdAt: new Date(Date.now() - index * 3600000 * 6).toISOString(),
  updatedAt: new Date(Date.now() - index * 3600000 * 6).toISOString(),
}))

export function PostCard({ onOpenAllPosts, limit = 3, dashboard = false }: PostCardProps) {
  const [posts, setPosts] = useState<PostListItem[]>([])

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const all = postsArrays
          .flat()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPosts((all.length > 0 ? all : fallbackPosts).slice(0, limit))
      } catch {
        setPosts(fallbackPosts.slice(0, limit))
      }
    }
    fetchRecentPosts()
  }, [limit])

  return (
    <section className={dashboard ? 'surface-card panel posts-panel posts-panel--dashboard' : 'surface-card panel posts-panel'}>
      <header className="panel-header">
        <div>
          {dashboard ? <p className="portal-section-eyebrow">Community</p> : null}
          <h2 className="panel-title">
            <Icon name="file" size={16} />
            <span>{dashboard ? '전체 게시글 업데이트' : '전체 게시글'}</span>
          </h2>
        </div>
        <button type="button" className="panel-action panel-action--solid" onClick={onOpenAllPosts}>
          게시글 보기
        </button>
      </header>

      <ul className="post-list">
        {posts.length === 0 ? (
          <li className="post-item" style={{ opacity: 0.5 }}>
            게시글이 없습니다.
          </li>
        ) : (
          posts.map((post) => (
            <li key={`${post.boardId}-${post.postId}`} className="post-item">
              <div className="post-item-heading">
                <span className="post-board-chip">{post.boardName ?? `게시판 ${post.boardId}`}</span>
                <p className="post-title">{post.title}</p>
              </div>
              <p className="post-meta">
                <span>{formatRelativeTime(post.createdAt)}</span>
                <span className="dot-divider" />
                <span>{post.authorName ?? `사용자 ${post.userId}`}</span>
                <span className="dot-divider" />
                <span>조회 {post.viewCount}</span>
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
