export type CommunityBoardFilterId = 'notice' | 'free' | 'humor'
export type InfoBoardFilterId = 'news' | 'contest' | 'lab' | 'resource'
export type CommunityWriterType = 'community' | 'info' | 'inquiry' | 'recruit'

type BoardLike = {
  boardId: number
  boardName: string
  boardType: 'NORMAL' | 'RECRUIT'
}

const communityBoardNameToFilter: Record<string, CommunityBoardFilterId> = {
  notice: 'notice',
  '공지': 'notice',
  free: 'free',
  '자유': 'free',
  humor: 'humor',
  '유머': 'humor',
}

const infoBoardNameToFilter: Record<string, InfoBoardFilterId> = {
  news: 'news',
  '소식': 'news',
  contest: 'contest',
  '대회': 'contest',
  lab: 'lab',
  '연구실': 'lab',
  resource: 'resource',
  resources: 'resource',
  '자료': 'resource',
}

export const fallbackCommunityBoardIds: Record<CommunityBoardFilterId, number> = {
  notice: 1,
  free: 2,
  humor: 3,
}

export const fallbackInfoBoardIds: Record<InfoBoardFilterId, number> = {
  news: 11,
  contest: 12,
  lab: 13,
  resource: 14,
}

export const fallbackRecruitBoardId = 31

function normalizeBoardName(name: string) {
  return name.trim().toLowerCase()
}

function resolveName<T extends string>(name: string, map: Record<string, T>) {
  const normalized = normalizeBoardName(name)
  return map[normalized] ?? Object.entries(map).find(([key]) => normalized.includes(key))?.[1] ?? null
}

export function resolveCommunityBoardFilter(board: Pick<BoardLike, 'boardName' | 'boardType'>) {
  if (board.boardType !== 'NORMAL') return null
  return resolveName(board.boardName, communityBoardNameToFilter)
}

export function resolveInfoBoardFilter(board: Pick<BoardLike, 'boardName' | 'boardType'>) {
  if (board.boardType !== 'NORMAL') return null
  return resolveName(board.boardName, infoBoardNameToFilter)
}

export function isCommunityBoard(board: Pick<BoardLike, 'boardName' | 'boardType'>) {
  return resolveCommunityBoardFilter(board) !== null
}

export function isInfoBoard(board: Pick<BoardLike, 'boardName' | 'boardType'>) {
  return resolveInfoBoardFilter(board) !== null
}

export function getFallbackInfoBoardId(filter: InfoBoardFilterId) {
  return fallbackInfoBoardIds[filter]
}

export function getFallbackInfoBoardIdByPostId(postId: string | number) {
  const numericPostId = Number(postId)
  if (!Number.isFinite(numericPostId)) return fallbackInfoBoardIds.news

  const index = Math.max(0, Math.floor(numericPostId) - 1)
  const filters = Object.keys(fallbackInfoBoardIds) as InfoBoardFilterId[]
  return fallbackInfoBoardIds[filters[index % filters.length]]
}

export function makePostRouteKey(boardId: string | number, postId: string | number) {
  return `${boardId}-${postId}`
}

export function parsePostRouteKey(value: string) {
  const match = value.match(/^(\d+)-(\d+)$/)
  if (!match) return null

  const boardId = Number(match[1])
  const postId = Number(match[2])
  return Number.isSafeInteger(boardId) && Number.isSafeInteger(postId)
    ? { boardId, postId }
    : null
}

export function parseRouteId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}
