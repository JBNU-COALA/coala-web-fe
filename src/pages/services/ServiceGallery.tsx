import { useState } from 'react'
import { SafeImage } from '../../shared/ui/SafeImage'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { Icon } from '../../shared/ui/Icon'

export function ServiceGallery({ title, images }: { title: string; images: string[] }) {
  const [selected, setSelected] = useState(0)
  const [direction, setDirection] = useState<'next' | 'previous'>('next')
  const sources = [...new Set(images.filter(Boolean))]
  if (!sources.length) sources.push('/portal-koala-team.png')
  const activeIndex = selected < sources.length ? selected : 0
  function showImage(index: number, nextDirection: 'next' | 'previous') {
    setDirection(nextDirection)
    setSelected((index + sources.length) % sources.length)
  }
  return <div className="project-gallery">
    <div className="project-gallery-main">
      <div key={sources[activeIndex]} className={`project-gallery-slide project-gallery-slide--${direction}`}>
        <SafeImage src={resolveApiAssetUrl(sources[activeIndex])} alt={`${title} 프로젝트 이미지 ${activeIndex + 1}`}
          fallback={<img src="/portal-koala-team.png" alt={`${title} 프로젝트 이미지 대체`} />} />
      </div>
      {sources.length > 1 && <>
        <button type="button" className="project-gallery-arrow project-gallery-arrow--previous" aria-label="이전 이미지" onClick={() => showImage(activeIndex - 1, 'previous')}><Icon name="chevron-left" size={20} /></button>
        <button type="button" className="project-gallery-arrow project-gallery-arrow--next" aria-label="다음 이미지" onClick={() => showImage(activeIndex + 1, 'next')}><Icon name="chevron-right" size={20} /></button>
        <span className="sr-only" aria-live="polite" aria-atomic="true">{sources.length}개 중 {activeIndex + 1}번 이미지</span>
      </>}
    </div>
    {sources.length > 1 && <div className="project-gallery-thumbnails" aria-label="프로젝트 이미지 선택">
      {sources.map((source, index) => <button key={source} type="button" aria-label={`${index + 1}번 이미지 보기`} aria-pressed={activeIndex === index} onClick={() => showImage(index, index < activeIndex ? 'previous' : 'next')}>
        <SafeImage src={resolveApiAssetUrl(source)} alt="" loading="lazy" fallback={<img src="/portal-koala-team.png" alt="" />} />
      </button>)}
    </div>}
  </div>
}
