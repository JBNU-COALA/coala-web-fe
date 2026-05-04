export type MarkdownCopyState = 'idle' | 'copied' | 'error'

const fallbackCopy = (markdown: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = markdown
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy')
    return true
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

export async function copyMarkdown(markdown: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(markdown)
      return true
    }

    return fallbackCopy(markdown)
  } catch {
    return false
  }
}

export function downloadMarkdown(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename.endsWith('.md') ? filename : `${filename}.md`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function toMarkdownFilename(title: string, fallback = 'coala-markdown') {
  const normalized = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)

  return `${normalized || fallback}.md`
}

export function htmlToReadableMarkdown(html: string) {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n')
    .replace(/<\/ul>|<\/ol>/gis, '\n')
    .replace(/<pre><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}
