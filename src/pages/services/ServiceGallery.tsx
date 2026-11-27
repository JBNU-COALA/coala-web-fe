import { useState } from 'react'
import { SafeImage } from '../../shared/ui/SafeImage'
import { resolveApiAssetUrl } from '../../shared/api/client'

export function ServiceGallery({ title, images }: { title: string; images: string[] }) {
  const [selected, setSelected] = useState(0)
  const sources = [...new Set(images.filter(Boolean))]
  if (!sources.length) sources.push('/portal-koala-team.png')
  return <div className="project-gallery">
    <div className="project-gallery-main">
      <SafeImage key={sources[selected]} src={resolveApiAssetUrl(sources[selected] ?? sources[0])} alt={`${title} 프로젝트 이미지`}
        fallback={<img src="/portal-koala-team.png" alt="" />} />
    </div>
    {sources.length > 1 && <div className="project-gallery-thumbnails" aria-label="프로젝트 이미지 선택">
      {sources.map((source, index) => <button key={source} type="button" aria-label={`${index + 1}번 이미지 보기`} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <SafeImage src={resolveApiAssetUrl(source)} alt="" loading="lazy" fallback={<img src="/portal-koala-team.png" alt="" />} />
      </button>)}
    </div>}
  </div>
}
