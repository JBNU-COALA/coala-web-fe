import { describe, expect, it } from 'vitest'
import { isCommunityBoard, resolveCommunityBoardFilter, resolveInfoBoardFilter } from './communityBoards'

describe('stable board categories', () => {
  it('keeps classification after a display-name change', () => {
    expect(resolveCommunityBoardFilter({ boardName: '운영 안내', boardType: 'NORMAL', categoryKey: 'notice' })).toBe('notice')
    expect(resolveInfoBoardFilter({ boardName: '새로운 이름', boardType: 'NORMAL', categoryKey: 'lab' })).toBe('lab')
  })
  it('does not infer a different category from the name when a key is provided', () => {
    expect(isCommunityBoard({ boardName: '자유', boardType: 'NORMAL', categoryKey: 'resource' })).toBe(false)
    expect(resolveCommunityBoardFilter({ boardName: '공지', boardType: 'ANONYMOUS', categoryKey: 'notice' })).toBeNull()
  })
  it('reads older deployed responses without the key during rollout', () => {
    expect(resolveCommunityBoardFilter({ boardName: '공지사항', boardType: 'NORMAL' })).toBe('notice')
  })
})
