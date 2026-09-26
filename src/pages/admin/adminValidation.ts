export function isInternalPath(value: string): boolean {
  let decoded = value
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const hasUnsafeCharacter = Array.from(decoded).some((character) => character === '\\' || character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)
    if (!decoded.startsWith('/') || decoded.startsWith('//') || hasUnsafeCharacter) return false
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) return true
      decoded = next
    } catch { return false }
  }
  return false
}

export function isImageUrl(value: string): boolean {
  if (!value) return true
  if (value.startsWith('/')) return isInternalPath(value)
  try { return ['http:', 'https:'].includes(new URL(value).protocol) }
  catch { return false }
}

export function isHttpUrl(value: string): boolean {
  if (!value) return false
  try { return ['http:', 'https:'].includes(new URL(value).protocol) }
  catch { return false }
}
