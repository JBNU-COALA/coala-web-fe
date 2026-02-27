import { LeaderboardCard } from '../../features/home/ui/LeaderboardCard'
import { HeroBanner } from '../../features/home/ui/HeroBanner'
import { PostCard } from '../../features/home/ui/PostCard'
import { RecruitHighlightsCard } from '../../features/home/ui/RecruitHighlightsCard'
import { ResourcesCard } from '../../features/home/ui/ResourcesCard'

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
