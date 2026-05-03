import client from './client'

export type PostListItem = {
  postId: number
  boardId: number
  boardName?: string
  userId: number
  authorName?: string
  title: string
  content: string
  viewCount: number
  commentCount?: number
  likeCount?: number
  createdAt: string
  updatedAt: string
}

export type PostDetail = PostListItem

export type CreatePostRequest = {
  title: string
  content: string
}

export type CreatePostResponse = {
  postId: number
  title: string
  content: string
}

export type CommentItem = {
  commentId: number
  userId?: number
  authorName?: string
  content: string
  createdAt: string
  updatedAt?: string
}

export type PostLikeResponse = {
  liked: boolean
  likeCount: number
}

export type CommentLikeResponse = {
  liked: boolean
  likeCount: number
}

export const postsApi = {
  getPosts: (boardId: number) =>
    client.get<PostListItem[]>(`/api/boards/${boardId}/posts`).then((r) => r.data),

  getPostDetail: (boardId: number, postId: number) =>
    client.get<PostDetail>(`/api/boards/${boardId}/posts/${postId}`).then((r) => r.data),

  createPost: (boardId: number, data: CreatePostRequest) =>
    client.post<CreatePostResponse>(`/api/boards/${boardId}/posts`, data).then((r) => r.data),

  updatePost: (postId: number, data: CreatePostRequest) =>
    client.patch<{ postId: number; title: string; content: string; updatedAt: string }>(
      `/api/posts/${postId}`,
      data,
    ).then((r) => r.data),

  deletePost: (postId: number) =>
    client.delete(`/api/posts/${postId}`),

  likePost: (postId: number) =>
    client.post<PostLikeResponse>(`/api/posts/${postId}/likes`).then((r) => r.data),

  getComments: (postId: number) =>
    client.get<CommentItem[]>(`/api/posts/${postId}/comments`).then((r) => r.data),

  createComment: (postId: number, content: string) =>
    client.post<CommentItem>(`/api/posts/${postId}/comments`, { content }).then((r) => r.data),

  updateComment: (postId: number, commentId: number, content: string) =>
    client.patch<{ commentId: number; content: string; updatedAt: string }>(
      `/api/posts/${postId}/comments/${commentId}`,
      { content },
    ).then((r) => r.data),

  deleteComment: (postId: number, commentId: number) =>
    client.delete(`/api/posts/${postId}/comments/${commentId}`),

  likeComment: (postId: number, commentId: number) =>
    client.post<CommentLikeResponse>(
      `/api/posts/${postId}/comments/${commentId}/likes`,
    ).then((r) => r.data),
}
