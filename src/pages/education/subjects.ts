import { routes } from '../../shared/routes'
import type { IconName } from '../../shared/ui/Icon'

// Only navigation belongs here; labels, counts and content come from the catalog API.
export function subjectPath(id: string) {
  if (id === 'hacking') return routes.education.hacking.root
  if (id === 'algorithms') return routes.education.algorithms.root
  return `/education/subjects/${encodeURIComponent(id)}`
}
export function subjectIcon(id: string): IconName { return id === 'hacking' ? 'network' : id === 'algorithms' ? 'list' : 'book' }
