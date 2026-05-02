import { useEffect, useState } from 'react'
import { homeHeroSlides, portalUpdates } from './homeData'
import { PostCard } from './PostCard'
import { ResourcesCard } from './ResourcesCard'

type HomePageProps = {
  onOpenAllPosts?: () => void
  onOpenInfo?: () => void
}

export function HomePage({ onOpenAllPosts, onOpenInfo }: HomePageProps) {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % homeHeroSlides.length)
    }, 5200)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="coala-content coala-content--portal">
      <section className="portal-hero portal-hero--slider" aria-label="코알라 소개 슬라이더">
        {homeHeroSlides.map((slide, index) => (
          <article
            key={slide.id}
            className={index === activeSlide ? 'portal-slide is-active' : 'portal-slide'}
            aria-hidden={index !== activeSlide}
          >
            <img src={slide.imageUrl} alt="" className="portal-slide-image" />
            <div className="portal-slide-overlay" />
            <div className="portal-hero-copy">
              <p className="portal-hero-eyebrow">{slide.eyebrow}</p>
              <h1 className="portal-hero-title">{slide.title}</h1>
              <p className="portal-hero-subtitle">{slide.subtitle}</p>
            </div>
          </article>
        ))}

        <div className="portal-slider-dots" aria-label="소개 배너 선택">
          {homeHeroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === activeSlide ? 'portal-slider-dot is-active' : 'portal-slider-dot'}
              onClick={() => setActiveSlide(index)}
              aria-label={`${index + 1}번 소개 배너`}
            />
          ))}
        </div>
      </section>

      <div className="portal-grid portal-grid--dashboard">
        <ResourcesCard onOpenInfo={onOpenInfo} dashboard />
        <PostCard onOpenAllPosts={onOpenAllPosts} limit={8} dashboard />
      </div>

      <section className="surface-card panel portal-updates-panel">
        <header className="panel-header">
          <div>
            <p className="portal-section-eyebrow">Updates</p>
            <h2 className="panel-title">인기글</h2>
          </div>
          <button type="button" className="panel-action" onClick={onOpenAllPosts}>
            게시글 보기
          </button>
        </header>

        <ul className="portal-update-list">
          {portalUpdates.map((update) => (
            <li key={update.id} className="portal-update-item">
              <span className="portal-update-category">{update.category}</span>
              <div>
                <p className="portal-update-title">{update.title}</p>
                <p className="portal-update-meta">{update.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
