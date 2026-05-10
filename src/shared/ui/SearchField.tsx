import { Icon } from './Icon';
import './searchField.css';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  ariaLabel?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder,
  className = '',
  ariaLabel,
}: SearchFieldProps) {
  return (
    <label className={`search-field ${className}`.trim()}>
      <Icon name="search" size={16} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
    </label>
  );
}
