export type IconName =
  | 'copy-color'
  | 'link-color'
  | 'trash-color'
  | 'stop-color'
  | 'close'
  | 'calendar-color'
  | 'award-color'
  | 'github'
  | 'linkedin'
  | 'refresh'
  | 'pencil-color'
  | 'siren-color'
  | 'profile-color'
  | 'logout-color'
  | 'logout'
  | 'server'
  | 'server-color'
  | 'globe-color'
  | 'apply-color'
  | 'file-color'
  | 'message-color'
  | 'globe'
  | 'filter'
  | 'bell'
  | 'notification'
  | 'book'
  | 'calendar'
  | 'chart'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'copy'
  | 'edit'
  | 'eye-color'
  | 'eye'
  | 'file'
  | 'heart-color'
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
    case 'copy-color':
      return <g stroke="none"><rect x="3" y="3" width="13" height="16" rx="2" fill="#b4c7ed" /><rect x="8" y="7" width="13" height="16" rx="2" fill="#5f85cc" /><path d="M11 12h7M11 16h7M11 19h4" stroke="#fff" strokeWidth="1.5" /></g>
    case 'link-color':
      return <g fill="none" strokeWidth="2.5"><path d="m10 14 4-4" stroke="#a88adb" /><path d="m8 16-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0" stroke="#6d86cc" /><path d="m16 8 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" stroke="#9b75c9" transform="translate(-1 -1)" /></g>
    case 'close':
      return <path d="m6 6 12 12M18 6 6 18" />
    case 'calendar-color':
      return <g stroke="none"><rect x="3" y="4" width="18" height="18" rx="3" fill="#e8eef8" /><path d="M6 4h12a3 3 0 0 1 3 3v3H3V7a3 3 0 0 1 3-3Z" fill="#597fce" /><path d="M8 2v4M16 2v4" stroke="#334d83" /><path d="m8 15 3 3 5-6" stroke="#597fce" fill="none" /></g>
    case 'award-color':
      return <g stroke="none"><path d="m7 13-2 9 7-3 7 3-2-9" fill="#6d82ce" /><circle cx="12" cy="9" r="7" fill="#efb64c" /><path d="m12 4 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 7.5l3.5-.5Z" fill="#fff0bc" /></g>
    case 'siren-color':
      return <><path d="M12 2v2M4 4l2 2M20 4l-2 2M2 11h2M20 11h2" stroke="#e35151" /><path d="M6 18v-6a6 6 0 0 1 12 0v6Z" fill="#ef6262" stroke="none" /><path d="M9 12a3 3 0 0 1 3-3" stroke="#fff" /><rect x="4" y="18" width="16" height="4" rx="1.5" fill="#737373" stroke="none" /></>
    case 'profile-color':
      return <g stroke="none"><circle cx="12" cy="7.5" r="4.5" fill="#f2b98d" /><path d="M3 22v-3a9 9 0 0 1 18 0v3Z" fill="#4f78c4" /><path d="M7.5 6.5a4.5 4.5 0 0 1 9 0c-3 0-4-2-4-2s-1 2-5 2Z" fill="#59453b" /></g>
    case 'logout':
      return <><path d="M10 4H4v16h6M9 12h12m-4-4 4 4-4 4" /></>
    case 'logout-color':
      return <g stroke="none"><rect x="3" y="2" width="12" height="20" rx="2" fill="#eab875" /><path d="m3 2 8 3v17H3Z" fill="#c58b4f" /><circle cx="8" cy="12" r="1" fill="#fff" /><path d="m17 6 6 6-6 6v-4h-4v-4h4Z" fill="#d76b57" /></g>
    case 'refresh':
      return <path fill="currentColor" stroke="none" d="M19.1 4.9A10 10 0 1 0 22 12h-3a7 7 0 1 1-2-4.9L13 11h9V2Z" />
    case 'trash-color':
      return <g stroke="none"><path d="M6 7h12l-1 14H7Z" fill="#8b9aab" /><path d="M4 4h16v3H4zM9 2h6v2H9z" fill="#607286" /><path d="M10 10v8M14 10v8" stroke="#eef2f6" strokeWidth="1.5" /></g>
    case 'stop-color':
      return <g stroke="none"><circle cx="12" cy="12" r="10" fill="#df7777" /><rect x="8" y="8" width="8" height="8" rx="1" fill="#fff" /></g>
    case 'pencil-color':
      return <g stroke="none"><path fill="#fbbf24" d="m4 15 10-10 5 5L9 20l-6 1Z" /><path fill="#f59e0b" d="m6.5 17.5 10-10L19 10 9 20Z" /><path fill="#fda4af" d="m14 5 2-2a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3l-2 2Z" /><path fill="#e5e7eb" d="m13 6 2-2 5 5-2 2Z" /><path fill="#f5deb3" d="m4 15 5 5-6 1Z" /><path fill="#374151" d="m3.5 18 2.5 2.5-3 .5Z" /></g>
    case 'filter':
      return <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" /><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" /></>
    case 'linkedin':
      return <g stroke="none"><rect x="2" y="2" width="20" height="20" rx="2" fill="#0a66c2" /><path fill="#fff" d="M6 10h3v9H6zm1.5-5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM11 10h2.8v1.2c.6-1 1.4-1.5 2.6-1.5 2.8 0 3.6 1.7 3.6 4V19h-3v-4.7c0-1.2-.2-2.2-1.5-2.2s-1.5 1-1.5 2.2V19h-3Z" /></g>
    case 'github':
      return <path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.2 19.5v-2.3c-2.7.6-3.3-1.2-3.3-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.2 1.1 2.8.8.1-.6.4-1 .7-1.2-2.2-.3-4.5-1.1-4.5-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.9-.3 2.8 1a9.8 9.8 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .5 1.3.2 2.3.1 2.7 1 1 1 2 1 2.7 0 3.9-2.3 4.7-4.5 5 .4.3.7.9.7 1.8v3.2A10 10 0 0 0 12 2Z" />
    case 'apply-color':
      return <g stroke="none"><rect x="3" y="3" width="18" height="18" rx="5" fill="#4f7ed8" /><path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2" /></g>
    case 'file-color':
      return <g stroke="none"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="#d99b3f" /><path d="M15 2v5h5" fill="#f9db9f" /><path d="M8 11h8M8 15h8M8 18h5" stroke="#fff" strokeWidth="1.5" /></g>
    case 'message-color':
      return <g stroke="none"><path d="M5 3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9l-5 3v-3a3 3 0 0 1-2-3V6a3 3 0 0 1 3-3Z" fill="#8b72ce" /><circle cx="7" cy="11" r="1.3" fill="#fff" /><circle cx="12" cy="11" r="1.3" fill="#fff" /><circle cx="17" cy="11" r="1.3" fill="#fff" /></g>
    case 'server-color':
      return (
        <g stroke="none">
          <rect x="2" y="3" width="20" height="8" rx="2.5" fill="#4f7ed8" />
          <rect x="2" y="13" width="20" height="8" rx="2.5" fill="#315aaf" />
          <circle cx="6" cy="7" r="1.3" fill="#bcebd1" /><circle cx="6" cy="17" r="1.3" fill="#bcebd1" />
          <rect x="10" y="6" width="8" height="2" rx="1" fill="#dce8ff" />
          <rect x="10" y="16" width="8" height="2" rx="1" fill="#dce8ff" />
        </g>
      )
    case 'globe-color':
      return (
        <>
          <circle cx="12" cy="12" r="10" fill="#588edb" stroke="none" />
          <path d="m5 5 4-1 2 3-2 3H6L4 8Zm10 5 4 1 2 4-3 4-3-1-1-4-2-1Z" fill="#a7dfba" stroke="none" />
          <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="#fff" strokeOpacity=".6" strokeWidth="1" />
          <path d="M2 12h20" stroke="#fff" strokeOpacity=".6" strokeWidth="1" />
        </>
      )
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
    case 'heart-color':
      return <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" fill="#e77989" stroke="none" />
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
    case 'notification':
      return (
        <g stroke="none">
          <circle cx="12" cy="3.5" r="2" fill="#c58b35" />
          <circle cx="12" cy="19" r="3" fill="#c58b35" />
          <path d="M6 9a6 6 0 0 1 12 0v4l2 3v2H4v-2l2-3Z" fill="#efb64c" />
          <path d="M12 4a5 5 0 0 1 5 5v5l2 3h-4l-1-3V9a6 6 0 0 0-2-5Z" fill="#dfa03a" />
          <path d="M8 10V9a4 4 0 0 1 3-4" fill="none" stroke="#fff0bc" strokeWidth="1.5" />
        </g>
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
          <path d="m16 3 5 5L8 21H3v-5L16 3Z" />
          <path d="m13 6 5 5M3 16l5 5" />
        </>
      )
    case 'eye-color':
      return <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" fill="#dbeafe" stroke="#5b83be" /><circle cx="12" cy="12" r="3" fill="#466fa9" stroke="none" /><circle cx="13" cy="11" r="1" fill="#fff" stroke="none" /></>
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
