import { SafeImage } from './SafeImage'

type CharacterAvatarProps = {
  name: string
  seed?: string | number | null
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

function getSpritePosition(seed: string | number) {
  const value = String(seed)
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }

  const spriteIndex = Math.abs(hash) % 6
  const column = spriteIndex % 3
  const row = Math.floor(spriteIndex / 3)

  return `${column * 50}% ${row * 100}%`
}

function CharacterFallback({ seed }: { seed: string | number }) {
  return (
    <span
      className="character-avatar-sprite"
      style={{ backgroundPosition: getSpritePosition(seed) }}
      aria-hidden="true"
    />
  )
}

export function CharacterAvatar({
  name,
  seed = name,
  src,
  size = 'md',
  className = '',
}: CharacterAvatarProps) {
  const fallback = <CharacterFallback seed={seed ?? name} />

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
