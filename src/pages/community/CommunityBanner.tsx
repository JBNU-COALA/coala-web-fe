import './communityBanner.css'

type CommunityBannerProps = {
  title: string
  description?: string
  tone?: 'board' | 'info' | 'recruit' | 'service' | 'about' | 'users'
  images?: unknown[]
  headingLevel?: 1 | 2
  titleId?: string
}

export function CommunityBanner({
  title,
  description,
  tone = 'board',
  headingLevel = 2,
  titleId,
}: CommunityBannerProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <header className={`community-banner community-banner--${tone}`}>
      <Heading id={titleId} className="community-banner-title">{title}</Heading>
      {description ? <p className="community-banner-copy">{description}</p> : null}
    </header>
  )
}
