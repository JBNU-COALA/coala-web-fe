type CommunityBannerProps = {
  title: string
  description?: string
  tone?: 'board' | 'info' | 'recruit' | 'service' | 'about'
  images?: unknown[]
}

export function CommunityBanner({
  title,
  description,
  tone = 'board',
}: CommunityBannerProps) {
  return (
    <header className={`community-banner community-banner--${tone}`}>
      <div className="community-banner-copy">
        <h2 className="community-banner-title">{title}</h2>
        {description ? (
          <p className="community-banner-description" style={{ whiteSpace: 'pre-line' }}>
            {description}
          </p>
        ) : null}
      </div>
    </header>
  )
}
