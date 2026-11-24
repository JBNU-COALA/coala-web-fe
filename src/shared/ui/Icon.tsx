export type IconName =
  | 'github'
  | 'refresh'
  | 'pencil-color'
  | 'profile-color'
  | 'logout-color'
  | 'server'
  | 'globe'
  | 'filter'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'chart'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'copy'
  | 'edit'
  | 'eye'
  | 'file'
  | 'heart'
  | 'help-circle'
  | 'image'
  | 'layout'
  | 'link'
  | 'list'
  | 'message'
  | 'moon'
  | 'network'
  | 'palette'
  | 'plus'
  | 'play'
  | 'search'
  | 'settings'
  | 'user'
  | 'users'

type IconProps = {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}

const iconShape = (name: IconName) => {
  switch (name) {
    case 'profile-color':
      return <g stroke="none"><circle cx="12" cy="7.5" r="4.5" fill="#f2b98d" /><path d="M3 22v-3a9 9 0 0 1 18 0v3Z" fill="#4f78c4" /><path d="M7.5 6.5a4.5 4.5 0 0 1 9 0c-3 0-4-2-4-2s-1 2-5 2Z" fill="#59453b" /></g>
    case 'logout-color':
      return <g stroke="none"><rect x="3" y="2" width="12" height="20" rx="2" fill="#eab875" /><path d="m3 2 8 3v17H3Z" fill="#c58b4f" /><circle cx="8" cy="12" r="1" fill="#fff" /><path d="m17 6 6 6-6 6v-4h-4v-4h4Z" fill="#d76b57" /></g>
    case 'refresh':
      return <path fill="currentColor" stroke="none" d="M19.1 4.9A10 10 0 1 0 22 12h-3a7 7 0 1 1-2-4.9L13 11h9V2Z" />
    case 'pencil-color':
      return <g stroke="none"><path fill="#fbbf24" d="m4 15 10-10 5 5L9 20l-6 1Z" /><path fill="#f59e0b" d="m6.5 17.5 10-10L19 10 9 20Z" /><path fill="#fda4af" d="m14 5 2-2a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3l-2 2Z" /><path fill="#e5e7eb" d="m13 6 2-2 5 5-2 2Z" /><path fill="#f5deb3" d="m4 15 5 5-6 1Z" /><path fill="#374151" d="m3.5 18 2.5 2.5-3 .5Z" /></g>
    case 'filter':
      return <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" /><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" /></>
    case 'github':
      return <path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.2 19.5v-2.3c-2.7.6-3.3-1.2-3.3-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.2 1.1 2.8.8.1-.6.4-1 .7-1.2-2.2-.3-4.5-1.1-4.5-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.9-.3 2.8 1a9.8 9.8 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .5 1.3.2 2.3.1 2.7 1 1 1 2 1 2.7 0 3.9-2.3 4.7-4.5 5 .4.3.7.9.7 1.8v3.2A10 10 0 0 0 12 2Z" />
    case 'server':
      return <><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6" /></>
    case 'globe':
      return <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>
    case 'moon':
      return <path d="M18 14.5A6.5 6.5 0 1 1 13.5 6a5 5 0 0 0 4.5 8.5Z" />
    case 'user':
      return (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 19.5c1.5-2.7 3.8-4 6.5-4s5 1.3 6.5 4" />
        </>
      )
    case 'layout':
      return (
        <>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
        </>
      )
    case 'file':
      return (
        <>
          <path d="M8 3.5h6l3.5 3.5V20.5H8z" />
          <path d="M14 3.5V7h3.5" />
          <path d="M10.5 11.5h5" />
          <path d="M10.5 14.5h5" />
        </>
      )
    case 'heart':
      return (
        <path d="M12 20s-7.2-4.2-7.2-9.7A4 4 0 0 1 12 8a4 4 0 0 1 7.2 2.3C19.2 15.8 12 20 12 20Z" />
      )
    case 'network':
      return (
        <>
          <circle cx="6" cy="12" r="2.2" />
          <circle cx="18" cy="6" r="2.2" />
          <circle cx="18" cy="18" r="2.2" />
          <path d="M8 11l7.5-4" />
          <path d="M8 13l7.5 4" />
        </>
      )
    case 'users':
      return (
        <>
          <circle cx="9" cy="9" r="3" />
          <path d="M4.5 18c.9-2.4 2.5-3.6 4.5-3.6s3.6 1.2 4.5 3.6" />
          <circle cx="17.5" cy="10" r="2.3" />
          <path d="M14.5 18c.6-1.8 1.8-2.7 3.5-2.7" />
        </>
      )
    case 'calendar':
      return (
        <>
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M4 9.5h16" />
          <path d="M8 3.5v4" />
          <path d="M16 3.5v4" />
        </>
      )
    case 'settings':
      return (
        <>
          <circle cx="12" cy="12" r="2.8" />
          <path d="M12 3.5v2.2" />
          <path d="M12 18.3v2.2" />
          <path d="M3.5 12h2.2" />
          <path d="M18.3 12h2.2" />
          <path d="M5.7 5.7l1.6 1.6" />
          <path d="M16.7 16.7l1.6 1.6" />
          <path d="M18.3 5.7l-1.6 1.6" />
          <path d="M7.3 16.7l-1.6 1.6" />
        </>
      )
    case 'plus':
      return (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      )
    case 'book':
      return (
        <>
          <rect x="5" y="4.5" width="14" height="15" rx="2" />
          <path d="M9 8.5h6" />
          <path d="M9 12h6" />
          <path d="M9 15.5h4" />
        </>
      )
    case 'link':
      return (
        <>
          <path d="M10 14l4-4" />
          <path d="M7 9.5l-1.5 1.5a3.2 3.2 0 1 0 4.5 4.5L11.5 14" />
          <path d="M13 10l1.5-1.5a3.2 3.2 0 1 1 4.5 4.5L17 14.5" />
        </>
      )
    case 'list':
      return (
        <>
          <path d="M8 6.5h12" />
          <path d="M8 12h12" />
          <path d="M8 17.5h12" />
          <path d="M4 6.5h.01" />
          <path d="M4 12h.01" />
          <path d="M4 17.5h.01" />
        </>
      )
    case 'image':
      return (
        <>
          <rect x="4.5" y="5.5" width="15" height="13" rx="2" />
          <circle cx="9.2" cy="9.2" r="1.4" />
          <path d="M7.2 16l3.2-3 2.2 1.9 2.9-2.8 2 1.9" />
        </>
      )
    case 'play':
      return (
        <>
          <rect x="4.5" y="5.5" width="15" height="13" rx="2" />
          <path d="M10 9l4 3-4 3z" />
        </>
      )
    case 'palette':
      return (
        <>
          <path d="M12 4.5c-4.7 0-8.5 3.4-8.5 7.6 0 2.8 2.2 5.1 5.1 5.1h1.1c1 0 1.8.8 1.8 1.8 0 1.1.9 2 2 2 4 0 7-3.2 7-7.4 0-5-3.7-9.1-8.5-9.1Z" />
          <circle cx="8" cy="10" r="1" />
          <circle cx="12" cy="8.5" r="1" />
          <circle cx="15.5" cy="10.5" r="1" />
        </>
      )
    case 'bell':
      return (
        <>
          <path d="M6.5 16.5h11l-1.4-1.7V10a4.1 4.1 0 0 0-8.2 0v4.8Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </>
      )
    case 'chart':
      return (
        <>
          <path d="M4.5 19.5h15" />
          <rect x="6.5" y="12" width="2.6" height="5" rx="0.7" />
          <rect x="10.7" y="9.5" width="2.6" height="7.5" rx="0.7" />
          <rect x="14.9" y="7" width="2.6" height="10" rx="0.7" />
        </>
      )
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="5.5" />
          <path d="M15.2 15.2 19 19" />
        </>
      )
    case 'edit':
      return (
        <>
          <path d="M4.5 18.5V21h2.5l10-10-2.5-2.5z" />
          <path d="M13.8 5.8 16.2 3.4a1.7 1.7 0 0 1 2.4 0l2 2a1.7 1.7 0 0 1 0 2.4l-2.4 2.4Z" />
        </>
      )
    case 'eye':
      return (
        <>
          <path d="M3.5 12s3.2-5.5 8.5-5.5S20.5 12 20.5 12 17.3 17.5 12 17.5 3.5 12 3.5 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )
    case 'message':
      return (
        <>
          <path d="M5 5.5h14v10H9l-4 3z" />
        </>
      )
    case 'help-circle':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.5 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2-2.3 3.6" />
          <path d="M12 17.2h.01" />
        </>
      )
    case 'copy':
      return (
        <>
          <rect x="8" y="8" width="9" height="11" rx="1.6" />
          <path d="M6.5 14.5h-.9A1.6 1.6 0 0 1 4 12.9V5.6A1.6 1.6 0 0 1 5.6 4h7.3A1.6 1.6 0 0 1 14.5 5.6v1" />
        </>
      )
    case 'chevron-down':
      return <path d="m6 9 6 6 6-6" />
    case 'chevron-left':
      return <path d="m14.5 6-6 6 6 6" />
    case 'chevron-right':
      return <path d="m9.5 6 6 6-6 6" />
    default:
      return null
  }
}

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
  className,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {iconShape(name)}
    </svg>
  )
}
