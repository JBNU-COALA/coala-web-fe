import type { ReactNode } from 'react'
import { PageHero } from './PageHero'
import { CommunityBanner } from '../../pages/community/CommunityBanner'

type PageFrameProps = {
  title: string
  tone?: 'activity' | 'users' | 'archive'
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function PageFrame({
  title,
  tone = 'activity',
  children,
  className = '',
  bodyClassName = '',
}: PageFrameProps) {
  return (
    <section className={`coala-content page-frame ${className}`}>
      {tone === 'archive' ? <CommunityBanner title={title} description="함께 배우고 성장하는 데 필요한 자료를 모았어요." /> : <PageHero title={title} tone={tone} headingLevel="h1" />}
      <div className={`page-container page-frame-body ${bodyClassName}`}>
        {children}
      </div>
    </section>
  )
}
