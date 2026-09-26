import { describe, expect, it } from 'vitest'
import { authoredItems, profileActivityHref, type ProfileActivityItem } from './profileOverview'

const item: ProfileActivityItem = {
  id: 'item-1', kind: 'board', label: '', title: 'Test', excerpt: '', status: null,
  category: null, boardId: 2, postId: 9, externalId: 'record-1', viewCount: null, createdAt: '2026-09-26',
}

describe('profile activity destinations', () => {
  it.each([
    ['board', '/community/board/2/posts/9'], ['info', '/community/info/posts/9'],
    ['recruit', '/community/recruit/notices/record-1'], ['recruit-application', '/community/recruit/notices/record-1'],
    ['study', '/community/activity/records/record-1'], ['service', '/services/user/record-1'],
    ['instance', '/services/official/instance'], ['domain', '/services/official/domain'],
  ] as const)('maps %s to the existing route', (kind, expected) => {
    expect(profileActivityHref({ ...item, kind })).toBe(expected)
  })
  it('does not invent routes for incomplete API items', () => {
    expect(profileActivityHref({ ...item, postId: null })).toBeNull()
    expect(profileActivityHref({ ...item, kind: 'study', externalId: null })).toBeNull()
  })
  it('keeps private applications and attendance out of authored post counts', () => {
    const items = (['board', 'info', 'recruit', 'study', 'service', 'instance', 'domain', 'recruit-application'] as const)
      .map((kind) => ({ ...item, id: kind, kind }))
    expect(authoredItems(items).map((entry) => entry.kind)).toEqual(['board', 'info', 'recruit'])
  })
})
