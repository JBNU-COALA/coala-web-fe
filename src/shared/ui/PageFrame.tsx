import type { ReactNode } from 'react'
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
      {tone === 'archive' ? <CommunityBanner title={title} description="함께 배우고 성장하는 데 필요한 자료를 모았어요." />
        : tone === 'users' ? <CommunityBanner title={title} tone="users" description="함께 만드는 코알라 멤버" />
          : <CommunityBanner title={title} description="함께 배우고 성장하는 코알라의 활동을 기록해요." />}
      <div className={`page-container page-frame-body ${bodyClassName}`}>
        {children}
      </div>
    </section>
  )
}
