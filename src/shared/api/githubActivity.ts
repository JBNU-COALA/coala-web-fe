import client from './client'

export type GithubActivityData = {
  id: string
  type: 'commit' | 'pull-request' | 'release' | 'note'
  title: string
  repository: string
  description: string
  timeLabel: string
  url: string
  actor: string
  createdAt: string
}

export const githubActivityApi = {
  getPublicActivity: (username: string, limit = 10) =>
    client
      .get<GithubActivityData[]>('/api/github/public-activity', {
        params: { username, limit },
      })
      .then((response) => response.data),
}
