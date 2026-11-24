import './loadingSpinner.css'

type LoadingSpinnerProps = {
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function LoadingSpinner({ label = '불러오는 중', size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <span className={`loading-spinner loading-spinner--${size} ${className}`.trim()} role="status">
      <span className="loading-spinner-circle" aria-hidden="true" />
      <span className="loading-spinner-label">{label}</span>
    </span>
  )
}
