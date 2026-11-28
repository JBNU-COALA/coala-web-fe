import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SafeImage } from '../../shared/ui/SafeImage'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { Icon } from '../../shared/ui/Icon'

export function ServiceGallery({ title, images }: { title: string; images: string[] }) {
  const [selected, setSelected] = useState(0)
  const [direction, setDirection] = useState<'next' | 'previous'>('next')
  const [previous, setPrevious] = useState<number | null>(null)
  const [height, setHeight] = useState<number>()
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const request = useRef(0)
  const requestedIndex = useRef(0)
  const sources = [...new Set(images.filter(Boolean))]
  if (!sources.length) sources.push('/portal-koala-team.png')
  const activeIndex = selected < sources.length ? selected : 0
  const activeSource = sources[activeIndex]
  useEffect(() => () => { request.current += 1 }, [])
  useLayoutEffect(() => {
    const slide = slides.current[activeIndex]
    if (!slide) return
    const measure = () => {
      const nextHeight = slide.getBoundingClientRect().height
      if (nextHeight > 0) setHeight(nextHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(slide)
    return () => observer.disconnect()
  }, [activeIndex, activeSource])

  async function showImage(index: number, nextDirection: 'next' | 'previous') {
    const nextIndex = (index + sources.length) % sources.length
    requestedIndex.current = nextIndex
    const currentRequest = ++request.current
    if (nextIndex === activeIndex) return
    const img = slides.current[nextIndex]?.querySelector('img')
    // Keep the current image visible until the next one is decoded.
    if (img?.decode) {
      try { await img.decode() } catch { /* SafeImage displays the fallback. */ }
    }
    if (currentRequest !== request.current) return
    setPrevious(activeIndex)
    setDirection(nextDirection)
    setSelected(nextIndex)
  }
  return <div className="project-gallery">
    <div className="project-gallery-main">
      <div className="project-gallery-stage" style={{ height }}>
        {sources.map((source, index) => (
          <div key={source} ref={(element) => { slides.current[index] = element }}
            className={`project-gallery-slide${index === activeIndex ? ' is-active' : ''}`}
            aria-hidden={index !== activeIndex}
            style={{ transform: index === activeIndex ? 'translateX(0)' : `translateX(${(index === previous ? -1 : 1) * (direction === 'next' ? 24 : -24)}px)` }}>
            <SafeImage src={resolveApiAssetUrl(source)} alt={`${title} 프로젝트 이미지 ${index + 1}`}
              loading="eager" decoding="async"
              fallback={<img src="/portal-koala-team.png" alt={`${title} 프로젝트 이미지 대체`} />} />
          </div>
        ))}
      </div>
      {sources.length > 1 && <>
        <button type="button" className="project-gallery-arrow project-gallery-arrow--previous" aria-label="이전 이미지" onClick={() => void showImage(requestedIndex.current - 1, 'previous')}><Icon name="chevron-left" size={20} /></button>
        <button type="button" className="project-gallery-arrow project-gallery-arrow--next" aria-label="다음 이미지" onClick={() => void showImage(requestedIndex.current + 1, 'next')}><Icon name="chevron-right" size={20} /></button>
        <span className="sr-only" aria-live="polite" aria-atomic="true">{sources.length}개 중 {activeIndex + 1}번 이미지</span>
      </>}
    </div>
    {sources.length > 1 && <div className="project-gallery-thumbnails" aria-label="프로젝트 이미지 선택">
      {sources.map((source, index) => <button key={source} type="button" aria-label={`${index + 1}번 이미지 보기`} aria-pressed={activeIndex === index} onClick={() => void showImage(index, index < activeIndex ? 'previous' : 'next')}>
        <SafeImage src={resolveApiAssetUrl(source)} alt="" loading="lazy" fallback={<img src="/portal-koala-team.png" alt="" />} />
      </button>)}
    </div>}
  </div>
}
