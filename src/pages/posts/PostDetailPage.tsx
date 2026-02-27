import { useState } from 'react'
import {
  communityPosts,
  postCategoryMeta,
  postDetailContentById,
  type PostDetailContent,
} from '../../features/posts/model/postsData'
import { Icon } from '../../shared/ui/Icon'

type PostDetailPageProps = {
  postId: string
  onBack: () => void
  onWrite: () => void
}

const fallbackDetail: PostDetailContent = {
  subtitle: '커뮤니티 아카이브',
  coverGradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  tags: ['커뮤니티', '업데이트'],
  readingTime: '5분 분량',
  lastUpdated: '방금 전 업데이트',
  content: [
    {
      type: 'paragraph',
      text: '선택한 게시글 정보를 찾을 수 없어 기본 정보를 보여드리고 있어요. 목록으로 돌아가서 다른 게시글을 선택해 주세요.',
    },
  ],
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

type PostBlockRendererProps = {
  block: PostDetailContent['content'][number]
}

const PostContentBlock = ({ block }: PostBlockRendererProps) => {
  switch (block.type) {
    case 'heading':
      return <h3 className="post-content-heading">{block.text}</h3>
    case 'quote':
      return <blockquote className="post-content-quote">{block.text}</blockquote>
    case 'code':
      return (
        <pre className="post-content-code">
          <span className="post-code-lang">{block.language}</span>
          <code dangerouslySetInnerHTML={{ __html: escapeHtml(block.code) }} />
        </pre>
      )
    case 'list':
      return (
        <ul className="post-content-list">
          {block.items.map((item, itemIndex) => (
            <li key={`list-item-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      )
    default:
      return <p className="post-content-paragraph">{block.type === 'paragraph' ? block.text : ''}</p>
  }
}

export function PostDetailPage({ postId, onBack, onWrite }: PostDetailPageProps) {
  const post = communityPosts.find((candidate) => candidate.id === postId) ?? null
  const detail = postDetailContentById[postId] ?? fallbackDetail
  const category = post ? postCategoryMeta[post.category] : null
  const shareUrl = `https://coala.club/posts/${postId}`
  const [shareCopied, setShareCopied] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleCopyShareLink = async () => {
    const attemptCopy = async () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        return true
      }
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    }

    try {
      const copied = await attemptCopy()
      setShareCopied(copied ? 'copied' : 'error')
    } catch (error) {
      console.error(error)
      setShareCopied('error')
    }

    setTimeout(() => setShareCopied('idle'), 2000)
  }

  return (
    <section className="coala-content coala-content--post-detail">
      <article className="surface-card post-detail">
        <header className="post-detail-header">
          <button type="button" className="post-back-button" onClick={onBack}>
            <Icon name="chevron-left" size={16} />
            <span>목록으로 돌아가기</span>
          </button>

          <div className="post-header-actions">
            <button type="button" className="ghost-button" onClick={onWrite}>
              <Icon name="edit" size={15} />
              <span>새 글 쓰기</span>
            </button>
            <button
              type="button"
              className={
                shareCopied === 'copied'
                  ? 'ghost-button ghost-button--success'
                  : 'ghost-button'
              }
              onClick={handleCopyShareLink}
            >
              <Icon name={shareCopied === 'copied' ? 'copy' : 'link'} size={15} />
              <span>
                {shareCopied === 'copied'
                  ? '링크 복사 완료'
                  : shareCopied === 'error'
                    ? '다시 시도'
                    : '공유 링크 복사'}
              </span>
            </button>
          </div>
        </header>

        <div className="post-cover" style={{ background: detail.coverGradient }}>
          <div className="post-cover-text">
            {category ? (
              <span
                className={`board-context-pill board-context-pill--${category.tone} post-cover-pill`}
              >
                {category.label}
              </span>
            ) : null}
            <p className="post-cover-subtitle">{detail.subtitle}</p>
            <h1 className="post-cover-title">{post?.title ?? '게시글 정보를 찾을 수 없어요'}</h1>
          </div>

          <div className="post-cover-meta">
            <div className="post-meta-author">
              {post ? (
                <span className={`board-avatar board-avatar--${post.authorTone}`}>
                  {post.authorInitials}
                </span>
              ) : null}
              <div>
                <strong>{post?.author ?? '알 수 없음'}</strong>
                <span>
                  {post?.publishedAt ?? '방금 전'} · {detail.readingTime}
                </span>
              </div>
            </div>

            {post ? (
              <div className="post-meta-stats">
                <span>
                  <Icon name="eye" size={15} />
                  {post.views}
                </span>
                <span>
                  <Icon name="message" size={15} />
                  {post.comments}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="post-body">
          <div className="post-tags">
            {detail.tags.map((tag) => (
              <span key={tag} className="post-tag">
                #{tag}
              </span>
            ))}
            <span className="post-meta-updated">{detail.lastUpdated}</span>
          </div>

          <div className="post-content">
            {detail.content.map((block, index) => (
              <PostContentBlock key={`${block.type}-${index}`} block={block} />
            ))}
          </div>
        </div>
      </article>
    </section>
  )
}
