import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteApi, type SiteBanner } from '../../shared/api/site'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { SafeImage } from '../../shared/ui/SafeImage'
import './HomeCarousel.css'

const defaultBanners: SiteBanner[] = [
  { id: -1, eyebrow: 'TOGETHER WE BUILD', title: 'COALA Developer Club', description: '함께 만들고 운영하는 개발 동아리', targetPath: routes.about, actionLabel: '동아리 소개', tone: 'green', imageUrl: '', sortOrder: 0, enabled: true },
  { id: -2, eyebrow: 'COMMUNITY', title: '배우고, 나누고, 함께.', description: '새로운 이야기와 함께할 사람들을 만나보세요.', targetPath: routes.community.board, actionLabel: '커뮤니티', tone: 'blue', imageUrl: '', sortOrder: 1, enabled: true },
  { id: -3, eyebrow: 'MADE BY COALA', title: '아이디어에서 서비스로.', description: '코알라가 만들고 운영하는 서비스를 만나보세요.', targetPath: routes.services.root, actionLabel: '서비스 보기', tone: 'coral', imageUrl: '', sortOrder: 2, enabled: true },
]

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
        if (active) setBanners(items.filter((item) => item.enabled).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id))
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
    <section className="home-carousel" aria-label="코알라 주요 소식" aria-roledescription="캐러셀"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      onKeyDown={(event) => {
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
      <div className="home-carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {banners.map((banner, slideIndex) => {
          const Heading = slideIndex === 0 ? 'h1' : 'h2'
          const target = /^\/(?!\/)/.test(banner.targetPath) && !/[\\\s]/.test(banner.targetPath) ? banner.targetPath : routes.home
          return (
            <div key={banner.id} className={`home-carousel-slide home-carousel-slide--${banner.tone}`}
              role="group" aria-roledescription="슬라이드" aria-label={`${slideIndex + 1} / ${banners.length}`}
              aria-hidden={slideIndex !== activeIndex} inert={slideIndex !== activeIndex}>
              <div className="page-container home-carousel-inner">
                <div className="home-carousel-copy">
                  <p className="home-carousel-eyebrow">{banner.eyebrow}</p>
                  <Heading>{banner.title}</Heading>
                  <p className="home-carousel-description">{banner.description}</p>
                  <Link to={target} className="home-carousel-link">{banner.actionLabel || '자세히 보기'}<Icon name="chevron-right" size={16} /></Link>
                </div>
                <div className={`home-carousel-art${banner.imageUrl ? ' home-carousel-art--custom' : ''}`} aria-hidden="true">
                  <SafeImage src={banner.imageUrl || '/coala-developer.png'} alt="" loading={slideIndex === 0 ? 'eager' : 'lazy'}
                    fallback={<img src="/coala-developer.png" alt="" />} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {banners.length > 1 && <div className="home-carousel-controls page-container">
        <div className="home-carousel-dots" aria-label="배너 선택">
          {banners.map((banner, i) => <button key={banner.id} type="button" aria-label={`${i + 1}. ${banner.title}`}
            aria-current={i === activeIndex ? 'true' : undefined} title={banner.title} onClick={() => setIndex(i)}><span /></button>)}
        </div>
        <div className="home-carousel-buttons">
          <span aria-live={playing ? 'off' : 'polite'}>{activeIndex + 1} / {banners.length}</span>
          <button type="button" title="이전 배너" aria-label="이전 배너" onClick={() => move(-1)}><Icon name="chevron-left" size={18} /></button>
          <button type="button" title="다음 배너" aria-label="다음 배너" onClick={() => move(1)}><Icon name="chevron-right" size={18} /></button>
          {!reducedMotion && <button type="button" title={playing ? '자동 넘김 정지' : '자동 넘김 시작'} aria-label={playing ? '자동 넘김 정지' : '자동 넘김 시작'} onClick={() => setPlaying(!playing)}>
            {playing ? <span className="home-carousel-pause" aria-hidden="true">Ⅱ</span> : <Icon name="play" size={18} />}
          </button>}
        </div>
      </div>}
    </section>
  )
}
