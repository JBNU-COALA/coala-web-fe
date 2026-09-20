import type { ReactNode } from 'react'
import { PageHero } from './PageHero'

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
      <PageHero title={title} tone={tone} headingLevel="h1" />
      <div className={`page-container page-frame-body ${bodyClassName}`}>
        {children}
      </div>
    </section>
  )
}
