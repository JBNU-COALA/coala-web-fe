import { PageHero } from '../../shared/ui/PageHero'

type CommunityBannerProps = {
  title: string
  description?: string
  tone?: 'board' | 'info' | 'recruit' | 'service' | 'about' | 'users'
  images?: unknown[]
  meta?: string
}

export function CommunityBanner({
  title,
  description,
  tone = 'board',
  meta,
}: CommunityBannerProps) {
  return (
    <PageHero
      title={title}
      description={description}
      meta={meta}
      tone={tone}
      size="compact"
      className={`community-banner community-banner--${tone}`}
    />
  )
}
