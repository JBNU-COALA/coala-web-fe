import client from './client'

export type PostListItem = {
  postId: number
  boardId: number
  userId: number
  title: string
}

export type PostDetail = {
  postId: number
  boardId: number
  userId: number
  title: string
  content: string
  viewCount: number
  createdAt: string
  updatedAt: string
}

export type CreatePostRequest = {
  title: string
  content: string
}

export type CommentItem = {
  commentId: number
  content: string
  createdAt: string
  updatedAt: string
}

export const postsApi = {
  getPosts: (boardId: number) =>
    client.get<PostListItem[]>(`/api/boards/${boardId}/posts`).then((r) => r.data),

  getPostDetail: (boardId: number, postId: number) =>
    client.get<PostDetail>(`/api/boards/${boardId}/posts/${postId}`).then((r) => r.data),

  createPost: (boardId: number, data: CreatePostRequest) =>
    client.post<PostDetail>(`/api/boards/${boardId}/posts`, data).then((r) => r.data),

  getComments: (postId: number) =>
    client.get<CommentItem[]>(`/api/posts/${postId}/comments`).then((r) => r.data),

  createComment: (postId: number, content: string) =>
    client
      .post<CommentItem>(`/api/posts/${postId}/comments`, { content })
      .then((r) => r.data),
}
