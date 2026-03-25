import { LeaderboardCard } from './LeaderboardCard'
import { HeroBanner } from './HeroBanner'
import { PostCard } from './PostCard'
import { RecruitHighlightsCard } from './RecruitHighlightsCard'
import { ResourcesCard } from './ResourcesCard'

type HomePageProps = {
  onOpenAllPosts?: () => void
  onOpenInfo?: () => void
  onOpenRecruit?: () => void
  onOpenLeaderboard?: () => void
}

export function HomePage({
  onOpenAllPosts,
  onOpenInfo,
  onOpenRecruit,
  onOpenLeaderboard,
}: HomePageProps) {
  return (
    <section className="coala-content">
      <HeroBanner />
      <PostCard onOpenAllPosts={onOpenAllPosts} />
      <ResourcesCard onOpenInfo={onOpenInfo} />
      <RecruitHighlightsCard onOpenRecruit={onOpenRecruit} />
      <LeaderboardCard onOpenLeaderboard={onOpenLeaderboard} />
    </section>
  )
}
