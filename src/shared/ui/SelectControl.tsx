import { Icon } from './Icon'

export type SelectControlOption<T extends string> = {
  value: T
  label: string
}

type SelectControlProps<T extends string> = {
  value: T
  options: SelectControlOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
}

export function SelectControl<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
}: SelectControlProps<T>) {
  return (
    <label className={`select-control ${className}`.trim()}>
      <span className="select-control-label">{label}</span>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <Icon name="chevron-down" size={14} />
    </label>
  )
}
