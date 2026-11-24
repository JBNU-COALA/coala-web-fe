import './communityBanner.css'

type CommunityBannerProps = {
  title: string
  description?: string
  tone?: 'board' | 'info' | 'recruit' | 'service' | 'about' | 'users'
  images?: unknown[]
}

export function CommunityBanner({
  title,
  description,
  tone = 'board',
}: CommunityBannerProps) {
  return (
    <header className={`community-banner community-banner--${tone}`}>
      <h2 className="community-banner-title">{title}</h2>
      {description ? <p className="community-banner-copy">{description}</p> : null}
    </header>
  )
}
