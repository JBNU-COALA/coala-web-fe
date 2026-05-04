import client from './client'

export type BoardType = 'NORMAL' | 'RECRUIT'

export type BoardData = {
  boardId: number
  boardName: string
  boardType: BoardType
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateBoardRequest = {
  boardName: string
  boardType: BoardType
  description: string
}

export type UpdateBoardRequest = {
  boardName?: string
  description?: string
  isActive?: boolean
}

export const boardsApi = {
  getBoards: (isActive?: boolean) =>
    client
      .get<BoardData[]>('/api/boards', {
        params: isActive !== undefined ? { isActive } : undefined,
      })
      .then((r) => r.data),

  getBoardById: (boardId: number) =>
    client.get<BoardData>(`/api/boards/${boardId}`).then((r) => r.data),

  createBoard: (data: CreateBoardRequest) =>
    client.post<{ boardId: number; boardName: string; createdAt: string }>(
      '/api/boards',
      data,
    ).then((r) => r.data),

  updateBoard: (boardId: number, data: UpdateBoardRequest) =>
    client.patch<{ boardId: number; status: string }>(
      `/api/boards/${boardId}`,
      data,
    ).then((r) => r.data),

  deleteBoard: (boardId: number) =>
    client.delete(`/api/boards/${boardId}`),
}
