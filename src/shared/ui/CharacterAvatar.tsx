import { SafeImage } from './SafeImage'

type CharacterAvatarProps = {
  name: string
  seed?: string | number | null
  src?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

function getVariant(seed: string | number) {
  const value = String(seed)
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }

  return Math.abs(hash) % 2 === 0 ? 'MALE' : 'FEMALE'
}

function CharacterFallback({ seed, gender }: Pick<CharacterAvatarProps, 'gender'> & { seed: string | number }) {
  const female = (gender === 'MALE' || gender === 'FEMALE' ? gender : getVariant(seed)) === 'FEMALE'
  return (
    <svg className="character-avatar-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path fill={female ? '#f8e9ee' : '#e4f1eb'} d="M0 0h120v120H0z" />
      <path fill={female ? '#c97e96' : '#438675'} d="M21 120v-10c0-22 17-33 39-33s39 11 39 33v10" />
      <circle cx="27" cy="43" r="23" fill="#899c9d" />
      <circle cx="93" cy="43" r="23" fill="#899c9d" />
      <circle cx="27" cy="43" r="15" fill="#d6dddd" />
      <circle cx="93" cy="43" r="15" fill="#d6dddd" />
      <ellipse cx="60" cy="59" rx="37" ry="35" fill="#a7b7b7" />
      <path d="m47 29 5-11 8 9 8-9 5 13" fill="#a7b7b7" />
      <ellipse cx="60" cy="74" rx="22" ry="16" fill="#e7eeeb" />
      <ellipse cx="44" cy="57" rx="3.5" ry="4.5" fill="#283e3c" />
      <ellipse cx="76" cy="57" rx="3.5" ry="4.5" fill="#283e3c" />
      <ellipse cx="60" cy="64" rx="9" ry="12" fill="#304744" />
      <path d="M54 80q6 6 12 0" fill="none" stroke="#304744" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="37" cy="69" rx="6" ry="3.5" fill="#d9a6ab" />
      <ellipse cx="83" cy="69" rx="6" ry="3.5" fill="#d9a6ab" />
      {female ? (
        <g fill="#c97e96" stroke="#ad637d" strokeWidth="1.5">
          <path d="M82 26Q65 8 68 29q2 10 14 3Q98 45 99 24q-1-9-17 2Z" />
          <circle cx="83" cy="29" r="5" fill="#e6a6ba" />
        </g>
      ) : (
        <g fill="#285c50">
          <path d="m60 101-12-7v15l12-6 12 6V94Z" />
          <circle cx="60" cy="102" r="4" fill="#74ac98" />
        </g>
      )}
    </svg>
  )
}

export function CharacterAvatar({
  name,
  seed = name,
  src,
  gender,
  size = 'md',
  className = '',
}: CharacterAvatarProps) {
  const fallback = <CharacterFallback seed={seed ?? name} gender={gender} />

  return (
    <span
      className={`character-avatar character-avatar--${size} ${className}`.trim()}
      role="img"
      aria-label={`${name} 프로필`}
    >
      {src ? <SafeImage src={src} alt="" fallback={fallback} /> : fallback}
    </span>
  )
}
