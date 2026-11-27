import client from './client'

export type ManagedComment = { id: number; postId: number; boardId: number; postTitle: string; content: string; status: 'ACTIVE' | 'HIDDEN' | 'DELETED' | 'ADMIN_DELETED' | 'BLOCKED'; createdAt: string; reply: boolean }
export type ManagedComments = { comments: ManagedComment[]; totalPages: number; totalElements: number }
export type CommentAction = 'hide' | 'restore' | 'delete'
export const adminCommentsApi = {
  list: (status: string, q: string, page: number, signal: AbortSignal) => client.get<ManagedComments>('/api/admin/comments', { params: { status: status || undefined, q, page }, signal }).then((response) => response.data),
  act: (id: number, action: CommentAction, reason: string) => client.post<void>(`/api/admin/moderation/comments/${id}/${action}`, { reason }).then(() => undefined),
}
