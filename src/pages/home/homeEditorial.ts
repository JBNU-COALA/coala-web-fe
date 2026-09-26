import { resolveApiAssetUrl } from '../../shared/api/client'
import type { InfoArticle } from '../../shared/api/info'
import type { PostListItem } from '../../shared/api/posts'
import { extractFirstContentImage, toPlainContentPreview } from '../../shared/contentPreview'

export const infoCategoryLabel: Record<InfoArticle['filter'], string> = {
  news: '소식',
  contest: '대회',
  lab: '연구실',
  resource: '자료',
}

export function getInfoThumbnail(article: InfoArticle) {
  const source = extractFirstContentImage(article.content)
    || article.imageUrl
    || (article.thumbnailAttachmentId ? `/api/attachments/${article.thumbnailAttachmentId}/download` : '')
  return source ? resolveApiAssetUrl(source) : '/coala-card-placeholder.png'
}

export function getPostThumbnail(post: PostListItem) {
  const source = extractFirstContentImage(post.content)
    || (post.thumbnailAttachmentId ? `/api/attachments/${post.thumbnailAttachmentId}/download` : '')
  return source ? resolveApiAssetUrl(source) : '/coala-card-placeholder.png'
}

export function getServiceThumbnail(source?: string) {
  return source ? resolveApiAssetUrl(source) : '/coala-card-placeholder.png'
}

export function preview(content: string, limit = 120) {
  const plain = toPlainContentPreview(content)
  return plain.length > limit ? `${plain.slice(0, limit).trim()}...` : plain
}

export function formatHomeDate(value?: string | null) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}
