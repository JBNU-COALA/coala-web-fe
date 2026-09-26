import { routes } from '../../shared/routes'

export type ProfileActivityItem = {
  id: string
  kind: 'board' | 'info' | 'recruit' | 'study' | 'service' | 'recruit-application' | 'instance' | 'domain'
  label: string
  title: string
  excerpt: string
  status: string | null
  category: string | null
  boardId: number | null
  postId: number | null
  externalId: string | null
  viewCount: number | null
  createdAt: string
}

export type ProfileOverview = {
  isSelf: boolean
  items: ProfileActivityItem[]
  counts: {
    studyGroups: number
    studyRecords: number
    authoredPosts: number
    infoArticles: number
    recruits: number
    services: number
    recruitApplications: number | null
    pendingRecruitApplications: number | null
    savedRecruits: number | null
    instanceApplications: number | null
    domainApplications: number | null
  }
}

export function profileActivityHref(item: ProfileActivityItem): string | null {
  switch (item.kind) {
    case 'board': return item.boardId != null && item.postId != null
      ? routes.community.boardPost(item.boardId, item.postId) : null
    case 'info': return item.postId != null ? routes.community.infoPost(item.postId) : null
    case 'recruit':
    case 'recruit-application': return item.externalId ? routes.community.recruitNotice(item.externalId) : null
    case 'study': return item.externalId ? routes.community.activityRecord(item.externalId) : null
    case 'service': return item.externalId ? routes.services.userDetail(item.externalId) : null
    case 'instance': return routes.services.officialInstance
    case 'domain': return routes.services.officialDomain
    default: return null
  }
}

export function authoredItems(items: ProfileActivityItem[]) {
  return items.filter((item) => ['board', 'info', 'recruit'].includes(item.kind))
}
