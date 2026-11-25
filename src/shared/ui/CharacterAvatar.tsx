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
  return <img className="character-avatar-art" src={`/koala-avatar-plush-${female ? 'female' : 'male'}.png`} alt="" decoding="async" />
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
