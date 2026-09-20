import { Icon } from './Icon'

export type ViewMode = 'card' | 'list'

type ViewModeToggleProps = {
  value: ViewMode
  onChange: (value: ViewMode) => void
  showLabels?: boolean
  className?: string
}

export function ViewModeToggle({ value, onChange, showLabels = false, className = '' }: ViewModeToggleProps) {
  return (
    <div className={`view-toggle ${className}`.trim()} role="group" aria-label="보기 방식">
      <button
        type="button"
        className={value === 'card' ? 'is-active' : ''}
        aria-pressed={value === 'card'}
        title="카드형"
        onClick={() => onChange('card')}
      >
        <Icon name="layout" size={15} />
        {showLabels ? <span>카드</span> : null}
      </button>
      <button
        type="button"
        className={value === 'list' ? 'is-active' : ''}
        aria-pressed={value === 'list'}
        title="리스트형"
        onClick={() => onChange('list')}
      >
        <Icon name="list" size={15} />
        {showLabels ? <span>목록</span> : null}
      </button>
    </div>
  )
}
