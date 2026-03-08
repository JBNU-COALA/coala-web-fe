import client from './client'

export type BoardData = {
  boardId: number
  boardName: string
  boardType: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const boardsApi = {
  getBoards: (isActive?: boolean) =>
    client
      .get<BoardData[]>('/api/boards', {
        params: isActive !== undefined ? { isActive } : undefined,
      })
      .then((r) => r.data),
}
