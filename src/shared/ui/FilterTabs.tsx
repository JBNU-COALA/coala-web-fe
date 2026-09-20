import { Icon, type IconName } from './Icon'

export type FilterTabOption<T extends string> = {
  id: T
  label: string
  icon?: IconName
  tone?: string
}

type FilterTabsProps<T extends string> = {
  value: T
  options: FilterTabOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  separateFirst?: boolean
  className?: string
}

export function FilterTabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  separateFirst = false,
  className = '',
}: FilterTabsProps<T>) {
  return (
    <div className={`filter-tabs ${separateFirst ? 'filter-tabs--separate-first' : ''} ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {options.map((option, index) => (
        <div className="filter-tab-slot" key={option.id}>
          {separateFirst && index === 1 ? <span className="filter-tab-divider" aria-hidden="true" /> : null}
          <button
            type="button"
            role="tab"
            aria-selected={value === option.id}
            className={`filter-tab filter-tab--${option.tone ?? option.id}${value === option.id ? ' is-active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            {option.icon ? <Icon name={option.icon} size={15} /> : null}
            <span>{option.label}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
