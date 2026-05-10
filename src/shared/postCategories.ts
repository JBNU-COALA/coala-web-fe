export type PostBoardFilterId = 'notice' | 'free' | 'humor'

export type PostBadgeTone = PostBoardFilterId

type PostCategoryFilter = {
  id: PostBoardFilterId
  label: string
}

type PostCategoryMeta = {
  label: string
  tone: PostBadgeTone
  description: string
}

export const postCategoryFilters: PostCategoryFilter[] = [
  { id: 'notice', label: '공지' },
  { id: 'free', label: '자유' },
  { id: 'humor', label: '유머' },
]

export const postCategoryMeta: Record<PostBoardFilterId, PostCategoryMeta> = {
  notice: {
    label: '공지',
    tone: 'notice',
    description: '',
  },
  free: {
    label: '자유',
    tone: 'free',
    description: '',
  },
  humor: {
    label: '유머',
    tone: 'humor',
    description: '',
  },
}
