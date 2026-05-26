import client from './client'

export type ArchiveCategory = 'labs' | 'agents'

export type ArchiveItem = {
  id: number
  category: ArchiveCategory
  title: string
  summary: string
  content: string
  sourceUrl: string
  repositoryUrl: string
  tags: string[]
  ownerId?: number | null
  ownerName: string
  createdAt?: string | null
  updatedAt?: string | null
}

export type ArchiveItemPayload = {
  category: ArchiveCategory
  title: string
  summary: string
  content: string
  sourceUrl?: string
  repositoryUrl?: string
  tags: string[]
}

export const archiveApi = {
  getItems: (category?: ArchiveCategory | 'all', query?: string) =>
    client.get<ArchiveItem[]>('/api/archive', { params: { category, query } }).then((response) => response.data),

  getItem: (itemId: number) =>
    client.get<ArchiveItem>(`/api/archive/${itemId}`).then((response) => response.data),

  createItem: (data: ArchiveItemPayload) =>
    client.post<ArchiveItem>('/api/archive', data).then((response) => response.data),

  updateItem: (itemId: number, data: ArchiveItemPayload) =>
    client.patch<ArchiveItem>(`/api/archive/${itemId}`, data).then((response) => response.data),

  deleteItem: (itemId: number) =>
    client.delete<void>(`/api/archive/${itemId}`).then((response) => response.data),
}
