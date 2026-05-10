const markdownImagePattern = /!\[[^\]]*]\(\s*<?([^)\s>]+)>?(?:\s+["'][^)]*["'])?\s*\)/i
const htmlImagePattern = /<img\b[^>]*\bsrc=(["'])(.*?)\1/i
const bareImageUrlPattern = /https?:\/\/[^\s)<>]+?\.(?:png|jpe?g|webp|gif|avif)(?:\?[^\s)<>]*)?/i

function stripWrappingUrlBrackets(value: string) {
  return value.replace(/^<|>$/g, '').trim()
}

export function extractFirstContentImage(content: string) {
  const htmlImage = content.match(htmlImagePattern)?.[2]
  if (htmlImage) return stripWrappingUrlBrackets(htmlImage)

  const markdownImage = content.match(markdownImagePattern)?.[1]
  if (markdownImage) return stripWrappingUrlBrackets(markdownImage)

  return content.match(bareImageUrlPattern)?.[0] ?? ''
}

export function toPlainContentPreview(content: string) {
  return content
    .replace(htmlImagePattern, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(bareImageUrlPattern, ' ')
    .replace(/\[[^\]]+]\([^)]*\)/g, (match) => match.replace(/^\[|\]\([^)]*\)$/g, ''))
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
