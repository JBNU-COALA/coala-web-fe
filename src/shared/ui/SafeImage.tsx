import { useState, type ImgHTMLAttributes, type ReactNode } from 'react'

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: ReactNode
}

export function SafeImage({ fallback = null, onError, ...props }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null | undefined>(null)

  if (failedSrc !== null && failedSrc === props.src) return fallback

  return (
    <img
      {...props}
      onError={(event) => {
        setFailedSrc(props.src)
        onError?.(event)
      }}
    />
  )
}
