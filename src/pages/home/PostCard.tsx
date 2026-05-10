import { useEffect, useState } from 'react'
import { boardsApi } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { extractFirstContentImage } from '../../shared/contentPreview'
import { Icon } from '../../shared/ui/Icon'

type PostCardProps = {
  onOpenAllPosts?: () => void
  onOpenPost?: (boardId: number, postId: number) => void
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

function getPopularityScore(post: PostListItem) {
  return post.viewCount + (post.commentCount ?? 0) * 12 + (post.likeCount ?? 0) * 8
}

function sortByPopularity(posts: PostListItem[]) {
  return [...posts].sort((a, b) => {
    const scoreDiff = getPopularityScore(b) - getPopularityScore(a)
    if (scoreDiff !== 0) return scoreDiff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

function getPostThumbnailUrl(post: PostListItem) {
  const contentImageUrl = extractFirstContentImage(post.content)
  return contentImageUrl || (post.thumbnailAttachmentId ? `/api/attachments/${post.thumbnailAttachmentId}/download` : '')
}

export function PostCard({ onOpenAllPosts, onOpenPost, limit = 3, dashboard = false }: PostCardProps) {
  const [posts, setPosts] = useState<PostListItem[]>([])

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const all = sortByPopularity(postsArrays.flat())
        setPosts(all.slice(0, limit))
      } catch {
        setPosts([])
      }
    }
    fetchRecentPosts()
  }, [limit])

  return (
    <section className={dashboard ? 'surface-card panel posts-panel posts-panel--dashboard' : 'surface-card panel posts-panel'}>
      <header className="panel-header">
        <div>
          <h2 className="panel-title">
            <Icon name="file" size={16} />
            <span>{dashboard ? '인기글' : '전체 게시글'}</span>
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
          posts.map((post) => {
            const thumbnailUrl = getPostThumbnailUrl(post)

            return (
              <li key={`${post.boardId}-${post.postId}`} className="post-item">
                <button
                  type="button"
                  className={thumbnailUrl ? 'post-item-button post-item-button--with-thumbnail' : 'post-item-button'}
                  onClick={() => onOpenPost?.(post.boardId, post.postId)}
                >
                  {thumbnailUrl ? (
                    <span
                      className="post-item-thumbnail"
                      style={{ backgroundImage: `url(${thumbnailUrl})` }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="post-item-content">
                    <span className="post-item-heading">
                      <span className="post-board-chip">{post.boardName ?? `게시판 ${post.boardId}`}</span>
                      <span className="post-title">{post.title}</span>
                    </span>
                    <span className="post-meta">
                      <span>{formatRelativeTime(post.createdAt)}</span>
                      <span className="dot-divider" />
                      <span>{post.authorName ?? `사용자 ${post.userId}`}</span>
                      <span className="dot-divider" />
                      <span>조회 {post.viewCount}</span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}
