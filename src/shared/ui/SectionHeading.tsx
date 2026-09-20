import type { ReactNode } from 'react'

type SectionHeadingProps = {
  title: string
  eyebrow?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionHeading({ title, eyebrow, description, action, className = '' }: SectionHeadingProps) {
  return (
    <header className={`section-heading ${className}`.trim()}>
      <div>
        {eyebrow ? <p className="section-heading-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="section-heading-description">{description}</p> : null}
      </div>
      {action ? <div className="section-heading-action">{action}</div> : null}
    </header>
  )
}
