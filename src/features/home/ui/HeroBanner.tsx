import { useEffect, useState } from 'react'
import { homeHeroSlides } from '../model/homeData'

const AUTO_SLIDE_DELAY = 4800

export function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % homeHeroSlides.length)
    }, AUTO_SLIDE_DELAY)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return (
    <section className="hero-banner" aria-label="홈 하이라이트">
      {homeHeroSlides.map((slide, index) => (
        <article
          key={slide.id}
          className={
            index === activeIndex
              ? 'hero-slide is-active'
              : 'hero-slide'
          }
          aria-hidden={index !== activeIndex}
        >
          <img src={slide.imageUrl} alt={slide.title} className="hero-slide-image" />
          <div className="hero-slide-overlay" />
          <div className="hero-banner-content">
            <p className="hero-banner-eyebrow">{slide.eyebrow}</p>
            <h2 className="hero-banner-title">{slide.title}</h2>
            <p className="hero-banner-subtitle">{slide.subtitle}</p>
          </div>
        </article>
      ))}

      <div className="hero-dots" aria-label="배너 페이지 선택">
        {homeHeroSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={
              index === activeIndex
                ? 'hero-dot is-active'
                : 'hero-dot'
            }
            onClick={() => setActiveIndex(index)}
            aria-label={`${index + 1}번 배너 보기`}
          />
        ))}
      </div>
    </section>
  )
}
