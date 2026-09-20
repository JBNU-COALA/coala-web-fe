import { useState, type ImgHTMLAttributes, type ReactNode } from 'react'

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: ReactNode
}

export function SafeImage({ fallback = null, onError, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) return fallback

  return (
    <img
      {...props}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
    />
  )
}
