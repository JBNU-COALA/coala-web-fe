import { useEffect, useState } from 'react'
import { boardsApi } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { Icon } from '../../shared/ui/Icon'

type PostCardProps = {
  onOpenAllPosts?: () => void
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

export function PostCard({ onOpenAllPosts }: PostCardProps) {
  const [posts, setPosts] = useState<PostListItem[]>([])

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const all = postsArrays
          .flat()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPosts(all.slice(0, 3))
      } catch {
        setPosts([])
      }
    }
    fetchRecentPosts()
  }, [])

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
        {posts.length === 0 ? (
          <li className="post-item" style={{ opacity: 0.5 }}>
            게시글이 없습니다.
          </li>
        ) : (
          posts.map((post) => (
            <li key={`${post.boardId}-${post.postId}`} className="post-item">
              <p className="post-title">{post.title}</p>
              <p className="post-meta">
                <span>{formatRelativeTime(post.createdAt)}</span>
                <span className="dot-divider" />
                <span>사용자 {post.userId}</span>
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
