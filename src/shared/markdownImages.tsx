import type { ClipboardEvent, DragEvent } from 'react'
import type { ICommand } from '@uiw/react-md-editor/nohighlight'
import { Icon } from './ui/Icon'

const MARKDOWN_IMAGE_MAX_SIZE = 8 * 1024 * 1024
const MARKDOWN_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'

type MarkdownImageOptions = {
  uploadImage?: (file: File) => Promise<string>
  onError?: (message: string) => void
  getTextArea?: () => HTMLTextAreaElement | null
}

type InsertResult = {
  value: string
  cursor: number
}

const imageAltFromName = (name: string) => (
  name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim() || 'image'
)

const imageAltFromUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const filename = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).at(-1) ?? '')
    return imageAltFromName(filename || parsed.hostname)
  } catch {
    return 'image'
  }
}

const htmlDecode = (value: string) => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const isLikelyImageUrl = (value: string) => {
  if (!isHttpUrl(value)) return false

  try {
    const parsed = new URL(value)
    const pathname = parsed.pathname.toLowerCase()
    const format = (parsed.searchParams.get('format') || parsed.searchParams.get('fm') || '').toLowerCase()
    return (
      /\.(png|jpe?g|webp|gif|avif)(?:$|[?#])/i.test(`${pathname}${parsed.search}`) ||
      ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'].includes(format) ||
      parsed.hostname === 'images.unsplash.com' ||
      parsed.hostname.endsWith('.imagekit.io') ||
      parsed.hostname.endsWith('.cloudinary.com')
    )
  } catch {
    return false
  }
}

const markdownImageFromUrl = (url: string) => `![${imageAltFromUrl(url)}](<${url}>)`

function getImageUrlFromClipboardHtml(html: string) {
  const match = html.match(/<img\b[^>]*\bsrc=(["'])(.*?)\1/i)
  const src = match?.[2] ? htmlDecode(match[2]).trim() : ''
  return src && isHttpUrl(src) ? src : null
}

const fileToDataUrl = (file: File) => (
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('이미지를 읽지 못했습니다.'))
    })
    reader.addEventListener('error', () => reject(new Error('이미지를 읽지 못했습니다.')))
    reader.readAsDataURL(file)
  })
)

export function getMarkdownImageFiles(files: FileList | File[] | null | undefined) {
  return Array.from(files ?? []).filter((file) => file.type.startsWith('image/'))
}

export function validateMarkdownImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    return '이미지 파일만 첨부할 수 있습니다.'
  }

  if (!MARKDOWN_IMAGE_ACCEPT.split(',').includes(file.type)) {
    return 'PNG, JPG, WebP, GIF 이미지만 첨부할 수 있습니다.'
  }

  if (file.size > MARKDOWN_IMAGE_MAX_SIZE) {
    return '이미지는 4MB 이하만 첨부할 수 있습니다.'
  }

  return null
}

export async function createMarkdownImageText(
  file: File,
  uploadImage: MarkdownImageOptions['uploadImage'] = fileToDataUrl,
) {
  const error = validateMarkdownImageFile(file)
  if (error) throw new Error(error)

  const imageUrl = await uploadImage(file)
  return `![${imageAltFromName(file.name)}](${imageUrl})`
}

export async function createMarkdownImagesText(
  files: FileList | File[],
  options: MarkdownImageOptions = {},
) {
  const imageFiles = getMarkdownImageFiles(files)
  if (imageFiles.length === 0) return ''

  const markdownImages = await Promise.all(
    imageFiles.map((file) => createMarkdownImageText(file, options.uploadImage)),
  )
  return markdownImages.join('\n\n')
}

export function getMarkdownLengthWithoutInlineImageData(markdown: string) {
  return markdown.replace(/!\[[^\]]*]\(data:image\/[^)]*\)/g, '![image]()').length
}

export function insertMarkdownBlockAtRange(
  value: string,
  markdown: string,
  start: number,
  end: number,
): InsertResult {
  const before = value.slice(0, start)
  const after = value.slice(end)

  return {
    value: `${before}${markdown}${after}`,
    cursor: before.length + markdown.length,
  }
}

function insertMarkdownIntoTextArea(textarea: HTMLTextAreaElement, markdown: string) {
  if (typeof window === 'undefined') return false

  const result = insertMarkdownBlockAtRange(
    textarea.value,
    markdown,
    textarea.selectionStart,
    textarea.selectionEnd,
  )
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set

  if (valueSetter) valueSetter.call(textarea, result.value)
  else textarea.value = result.value

  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  window.requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(result.cursor, result.cursor)
  })

  return true
}

export function createMarkdownImageCommand(options: MarkdownImageOptions = {}): ICommand {
  return {
    name: 'image-upload',
    keyCommand: 'image-upload',
    buttonProps: {
      'aria-label': '이미지 첨부',
      title: '이미지 첨부',
    },
    icon: <Icon name="image" size={13} />,
    execute: (_state, api) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = MARKDOWN_IMAGE_ACCEPT
      input.multiple = true

      input.addEventListener('change', async () => {
        try {
          if (!input.files || input.files.length === 0) return
          const markdown = await createMarkdownImagesText(input.files, options)
          if (!markdown) return

          const textarea = options.getTextArea?.()
          if (textarea && insertMarkdownIntoTextArea(textarea, markdown)) return

          api.replaceSelection(markdown)
        } catch (error) {
          options.onError?.(error instanceof Error ? error.message : '이미지를 첨부하지 못했습니다.')
        } finally {
          input.remove()
        }
      })

      input.click()
    },
  }
}

export async function readMarkdownImagesFromClipboard(
  event: ClipboardEvent<HTMLTextAreaElement>,
  options: MarkdownImageOptions = {},
) {
  const files = getMarkdownImageFiles(Array.from(event.clipboardData.files))
  if (files.length > 0) {
    event.preventDefault()
    return createMarkdownImagesText(files, options)
  }

  const htmlImageUrl = getImageUrlFromClipboardHtml(event.clipboardData.getData('text/html'))
  if (htmlImageUrl) {
    event.preventDefault()
    return markdownImageFromUrl(htmlImageUrl)
  }

  const text = event.clipboardData.getData('text/plain').trim()
  if (text && !/\s/.test(text) && isLikelyImageUrl(text)) {
    event.preventDefault()
    return markdownImageFromUrl(text)
  }

  return null
}

export async function readMarkdownImagesFromDrop(
  event: DragEvent<HTMLTextAreaElement>,
  options: MarkdownImageOptions = {},
) {
  const files = getMarkdownImageFiles(Array.from(event.dataTransfer.files))
  if (files.length === 0) return null

  event.preventDefault()
  return createMarkdownImagesText(files, options)
}
