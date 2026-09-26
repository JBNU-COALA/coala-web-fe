import { useEffect, useState } from 'react'
import { boardsApi } from '../../shared/api/boards'
import { infoApi, type InfoArticle } from '../../shared/api/info'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { recruitsApi, type RecruitItem } from '../../shared/api/recruits'
import { servicesApi, type MemberService } from '../../shared/api/services'
import { isCommunityBoard } from '../../shared/communityBoards'

export type HomeFeed = {
  articles: InfoArticle[]
  posts: PostListItem[]
  recruits: RecruitItem[]
  services: MemberService[]
  loading: boolean
  errors: Partial<Record<'articles' | 'posts' | 'recruits' | 'services', boolean>>
}

const initialFeed: HomeFeed = {
  articles: [],
  posts: [],
  recruits: [],
  services: [],
  loading: true,
  errors: {},
}

function timestamp(value?: string | null) {
  const parsed = value ? new Date(value).getTime() : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function popularity(post: PostListItem) {
  return post.viewCount + (post.commentCount ?? 0) * 12 + (post.likeCount ?? 0) * 8
}

export function useHomeFeed() {
  const [feed, setFeed] = useState<HomeFeed>(initialFeed)

  useEffect(() => {
    let active = true

    async function loadFeed() {
      const [articleResult, serviceResult, recruitResult, boardResult] = await Promise.allSettled([
        infoApi.getArticles('all'),
        servicesApi.getMemberServices(),
        recruitsApi.getRecruits({ status: 'all', sort: 'latest' }),
        boardsApi.getBoards(true),
      ])

      let posts: PostListItem[] = []
      let postsFailed = boardResult.status === 'rejected'
      if (boardResult.status === 'fulfilled') {
        const communityBoards = boardResult.value.filter(isCommunityBoard)
        const postResults = await Promise.allSettled(
          communityBoards.map((board) => postsApi.getPosts(board.boardId)),
        )
        posts = postResults.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
        postsFailed = postResults.some((result) => result.status === 'rejected')
      }

      if (!active) return

      const articles = articleResult.status === 'fulfilled'
        ? [...articleResult.value].sort((a, b) => timestamp(b.createdAt ?? b.sourceDate) - timestamp(a.createdAt ?? a.sourceDate))
        : []

      setFeed({
        articles: articles.slice(0, 5),
        posts: posts
          .sort((a, b) => popularity(b) - popularity(a) || timestamp(b.createdAt) - timestamp(a.createdAt))
          .slice(0, 5),
        recruits: recruitResult.status === 'fulfilled' ? recruitResult.value.slice(0, 3) : [],
        services: serviceResult.status === 'fulfilled' ? serviceResult.value.slice(0, 3) : [],
        loading: false,
        errors: { articles: articleResult.status === 'rejected', posts: postsFailed, recruits: recruitResult.status === 'rejected', services: serviceResult.status === 'rejected' },
      })
    }

    loadFeed().catch(() => {
      if (active) setFeed({ ...initialFeed, loading: false, errors: { articles: true, posts: true, recruits: true, services: true } })
    })

    return () => {
      active = false
    }
  }, [])

  return feed
}
