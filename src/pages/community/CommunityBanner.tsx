type CommunityBannerProps = {
  title: string
  description?: string
  tone?: 'board' | 'info' | 'recruit'
  images?: unknown[]
}

export function CommunityBanner({
  title,
  tone = 'board',
}: CommunityBannerProps) {
  return (
    <header className={`community-banner community-banner--${tone}`}>
      <div className="community-banner-copy">
        <h2 className="community-banner-title">{title}</h2>
      </div>
    </header>
  )
}
