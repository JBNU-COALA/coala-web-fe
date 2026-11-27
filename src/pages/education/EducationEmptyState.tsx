import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../shared/ui/Icon'

export function EducationEmptyState({ title, description, icon = 'book', action, image }: { title: string; description?: string; icon?: IconName; action?: ReactNode; image?: string }) {
  return <div className="education-empty">
    {image ? <img src={image} alt="" width={72} height={72} style={{ objectFit: 'contain' }} /> : <span className="education-empty-symbol" aria-hidden="true"><Icon name={icon} size={25} /></span>}
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div className="education-empty-action">{action}</div>}
  </div>
}
