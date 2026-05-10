import client from './client'

export type AvatarTone = 'mint' | 'sky' | 'amber' | 'slate' | 'sand' | 'rose'

export type SolvedTier =
  | 'ruby'
  | 'diamond'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'unrated'

export type ActivityLogType = 'commit' | 'pull-request' | 'release' | 'note'

export type ActivityLog = {
  id: string
  type: ActivityLogType
  title: string
  repository: string
  description: string
  timeLabel: string
}

export type UserAward = {
  awardId: string
  title: string
  organizer: string
  rank: string
  awardedAt: string
  category: 'competition' | 'hackathon' | 'research' | 'club'
  description: string
  credentialUrl?: string
}

export type ActivityMember = {
  id: string
  name: string
  initials: string
  tone: AvatarTone
  role: string
  grade: string
  lab: string
  githubHandle: string
  githubUrl: string
  focus: string
  bio: string
  activityNote: string
  awardNote: string
  recentCommit: string
  sharedRepos: string[]
  logs: ActivityLog[]
  solvedHandle: string
  solvedTier: SolvedTier
  solvedCount: number
  githubCommits: number
  totalPoints: number
  awards: UserAward[]
  isMe?: boolean
}

export const usersApi = {
  getUsers: () =>
    client.get<(Omit<ActivityMember, 'id'> & { id: number | string })[]>('/api/users')
      .then((response) => response.data.map((user) => ({ ...user, id: String(user.id) }))),

  getUser: (userId: number) =>
    client.get<Omit<ActivityMember, 'id'> & { id: number | string }>(`/api/users/${userId}`)
      .then((response) => ({ ...response.data, id: String(response.data.id) })),

  updateMyProfile: (data: {
    bio: string
    activityNote: string
    awardNote: string
    sharedRepositories: string
  }) =>
    client.patch<Omit<ActivityMember, 'id'> & { id: number | string }>('/api/users/me/profile', data)
      .then((response) => ({ ...response.data, id: String(response.data.id) })),
}
