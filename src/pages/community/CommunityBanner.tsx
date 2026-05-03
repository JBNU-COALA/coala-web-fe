type CommunityBannerImage = {
  imageUrl: string
  label: string
  title: string
}

type CommunityBannerProps = {
  title: string
  description?: string
  tone?: 'board' | 'info' | 'recruit'
  images?: CommunityBannerImage[]
}

const defaultImages: CommunityBannerImage[] = [
  {
    imageUrl:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
    label: '커뮤니티',
    title: '함께 만드는 코알라 활동',
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    label: '공유',
    title: '소식과 기록이 모이는 공간',
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
    label: '참여',
    title: '프로젝트와 사람을 연결합니다',
  },
]

export function CommunityBanner({
  title,
  description,
  tone = 'board',
  images = defaultImages,
}: CommunityBannerProps) {
  return (
    <header className={`community-banner community-banner--${tone}`}>
      <div className="community-banner-image-track" aria-hidden="true">
        {images.map((item) => (
          <span
            key={`${item.label}-${item.imageUrl}`}
            className="community-banner-image"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          />
        ))}
      </div>
      <div className="community-banner-scrim" aria-hidden="true" />

      <div className="community-banner-copy">
        <h2 className="community-banner-title">{title}</h2>
        {description ? <p className="community-banner-description">{description}</p> : null}
      </div>

      <div className="community-banner-caption">
        <span>{images[0]?.label}</span>
        <strong>{images[0]?.title}</strong>
      </div>
    </header>
  )
}
