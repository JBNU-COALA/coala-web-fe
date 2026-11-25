import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteApi, type SiteBanner } from '../../shared/api/site'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { SafeImage } from '../../shared/ui/SafeImage'
import './HomeCarousel.css'

const defaultBanners: SiteBanner[] = [
  { id: -1, eyebrow: '', title: '동아리의 소식과 활동을 한곳에서.', description: '새로운 소식을 확인하고, 함께할 멤버를 찾고, 필요한 서비스를 이용하세요. 코알라의 활동을 이어주는 공간입니다.', targetPath: routes.about, actionLabel: '동아리 소개', tone: 'green', imageUrl: '', sortOrder: 0, enabled: true },
  { id: -2, eyebrow: '', title: '개발 이야기를 나누고, 함께할 팀을 찾아보세요.', description: '게시판에서 질문과 경험을 나누고, 정보공유에서 대회와 학습 자료를 확인하세요. 스터디와 프로젝트 모집도 함께 살펴보세요.', targetPath: routes.community.board, actionLabel: '커뮤니티', tone: 'blue', imageUrl: '', sortOrder: 1, enabled: true },
  { id: -3, eyebrow: '', title: '프로젝트에 필요한 서비스, 여기서 시작하세요.', description: '인스턴스 대여와 도메인을 신청하고 진행 내역을 확인하세요. 멤버들이 직접 만든 서비스도 둘러볼 수 있습니다.', targetPath: routes.services.root, actionLabel: '서비스 보기', tone: 'coral', imageUrl: '', sortOrder: 2, enabled: true },
]

// Refresh the original seed copy while preserving administrator-authored banners.
function refreshDefaultCopy(banner: SiteBanner): SiteBanner {
  if (banner.imageUrl) return banner
  const legacyTitles = [
    ['COALA Developer Club', '함께 만드는 개발 동아리'],
    ['배우고, 나누고, 함께.'],
    ['아이디어에서 서비스로.'],
  ]
  const index = legacyTitles.findIndex((titles) => titles.includes(banner.title))
  if (index < 0) return banner
  const { title, description } = defaultBanners[index]
  return { ...banner, title, description }
}

export function HomeCarousel() {
  const [banners, setBanners] = useState(defaultBanners)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const activeIndex = banners.length ? index % banners.length : 0

  useEffect(() => {
    let active = true
    async function loadBanners() {
      try {
        const items = await siteApi.getBanners()
        if (active) setBanners(items.filter((item) => item.enabled).map(refreshDefaultCopy).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id))
      } catch {
        // Keep the navigation banners usable when this optional API is unavailable.
      }
    }
    void loadBanners()
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', onChange)
    return () => { active = false; preference.removeEventListener('change', onChange) }
  }, [])

  useEffect(() => {
    if (!playing || hovered || focused || reducedMotion || banners.length < 2) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % banners.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [playing, hovered, focused, reducedMotion, banners.length])

  function move(direction: number) {
    setIndex((current) => (current + direction + banners.length) % banners.length)
  }

  if (banners.length === 0) return null

  return (
    <section className={`home-carousel${!playing || hovered || focused ? ' is-paused' : ''}`} aria-label="코알라 주요 소식" aria-roledescription="캐러셀" tabIndex={0}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      onKeyDown={(event) => {
        if (event.key === ' ' && event.target === event.currentTarget) {
          event.preventDefault()
          setPlaying((current) => !current)
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}
      onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return
        const dx = event.changedTouches[0].clientX - touchStart.current.x
        const dy = event.changedTouches[0].clientY - touchStart.current.y
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1)
        touchStart.current = null
      }}>
      <div className="home-carousel-track">
        {banners.map((banner, slideIndex) => {
          const Heading = slideIndex === 0 ? 'h1' : 'h2'
          const target = /^\/(?!\/)/.test(banner.targetPath) && !/[\\\s]/.test(banner.targetPath) ? banner.targetPath : routes.home
          const loading = slideIndex === 0 ? 'eager' : 'lazy'
          return (
            <div key={banner.id} className={`home-carousel-slide home-carousel-slide--${banner.tone}${slideIndex === activeIndex ? ' is-active' : ''}${banner.imageUrl ? ' home-carousel-slide--media' : ''}`}
              role="group" aria-roledescription="슬라이드" aria-label={`${slideIndex + 1} / ${banners.length}`}
              aria-hidden={slideIndex !== activeIndex} inert={slideIndex !== activeIndex}>
              {banner.imageUrl ? (
                /* 관리자가 올린 배너는 문구가 이미지에 담겨 있어 화면 전체를 이미지로 채운다. */
                <Link to={target} className="home-carousel-media">
                  <SafeImage src={banner.imageUrl} alt="" loading={loading}
                    fetchPriority={slideIndex === 0 ? 'high' : undefined}
                    fallback={<span className="home-carousel-media-fallback" aria-hidden="true" />} />
                  <Heading className="home-carousel-media-label">{banner.title}</Heading>
                </Link>
              ) : (
                <div className="page-container home-carousel-inner">
                  <div className="home-carousel-copy">
                    <Heading>{banner.title}</Heading>
                    <p className="home-carousel-description">{banner.description}</p>
                    <Link to={target} className="home-carousel-link">{banner.actionLabel || '자세히 보기'}<Icon name="chevron-right" size={16} /></Link>
                  </div>
                  <div className="home-carousel-art" aria-hidden="true">
                    <SafeImage src={['/portal-koala-welcome.png', '/portal-koala-community.png', '/portal-koala-team.png'][slideIndex % 3]} alt="" loading={loading}
                      fallback={<span className="home-carousel-art-fallback" />} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {banners.length > 1 && <div className="home-carousel-controls page-container">
        <div className="home-carousel-dots" aria-label="배너 선택">
          {banners.map((banner, i) => <button key={banner.id} type="button" aria-label={`${i + 1}. ${banner.title}`}
            aria-current={i === activeIndex ? 'true' : undefined} title={banner.title} onClick={() => setIndex(i)}><span /></button>)}
        </div>

      </div>}
    </section>
  )
}
