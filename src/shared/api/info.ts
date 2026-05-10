import client from './client'

export type InfoFilterId = 'news' | 'contest' | 'lab' | 'resource'

export type InfoArticle = {
  id: number
  filter: InfoFilterId
  tag: string
  title: string
  meta: string
  source: string
  sourceName: string
  sourceDate: string
  content: string
  imageUrl: string
  viewCount: number
  bookmarkCount: number
  createdAt?: string | null
  updatedAt?: string | null
}

export type InfoArticlePayload = {
  filter: InfoFilterId
  tag: string
  title: string
  meta: string
  sourceName: string
  sourceDate: string
  content: string
  imageUrl: string
}

export const infoApi = {
  getArticles: (filter?: InfoFilterId | 'all', query?: string) =>
    client.get<InfoArticle[]>('/api/info', { params: { filter, query } }).then((response) => response.data),

  getArticle: (articleId: number) =>
    client.get<InfoArticle>(`/api/info/${articleId}`).then((response) => response.data),

  createArticle: (data: InfoArticlePayload) =>
    client.post<InfoArticle>('/api/info', data).then((response) => response.data),

  updateArticle: (articleId: number, data: InfoArticlePayload) =>
    client.patch<InfoArticle>(`/api/info/${articleId}`, data).then((response) => response.data),

  deleteArticle: (articleId: number) =>
    client.delete(`/api/info/${articleId}`),

  bookmarkArticle: (articleId: number) =>
    client.post<InfoArticle>(`/api/info/${articleId}/bookmarks`).then((response) => response.data),
}
