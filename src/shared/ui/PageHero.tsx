import type { ReactNode } from 'react'

type PageHeroProps = {
  title: string
  eyebrow?: string
  description?: string
  meta?: string
  tone?:
    | 'home'
    | 'about'
    | 'board'
    | 'info'
    | 'recruit'
    | 'service'
    | 'users'
    | 'archive'
    | 'activity'
  size?: 'compact' | 'large'
  headingLevel?: 'h1' | 'h2'
  action?: ReactNode
  className?: string
}

export function PageHero({
  title,
  eyebrow,
  description,
  meta,
  tone = 'board',
  size = 'compact',
  headingLevel = 'h2',
  action,
  className = '',
}: PageHeroProps) {
  const Heading = headingLevel

  return (
    <header
      className={`page-hero page-hero--${tone} page-hero--${size} ${className}`.trim()}
    >
      <div className="page-hero-grid" aria-hidden="true" />
      <div className="page-hero-inner page-container">
        <div className="page-hero-content">
          {eyebrow ? <p className="page-hero-eyebrow">{eyebrow}</p> : null}
          <Heading className="page-hero-title">{title}</Heading>
          {description ? (
            <p
              className="page-hero-description"
              style={{ whiteSpace: 'pre-line' }}
            >
              {description}
            </p>
          ) : null}
          {meta ? <p className="page-hero-meta">{meta}</p> : null}
          {action ? <div className="page-hero-actions">{action}</div> : null}
        </div>
        <div className="page-hero-art" aria-hidden="true">
          <img src="/coala-developer.png" alt="" />
        </div>
      </div>
    </header>
  )
}
