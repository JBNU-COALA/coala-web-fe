import type { ClipboardEvent, DragEvent } from 'react'
import type { ICommand, TextAreaTextApi, TextState } from '@uiw/react-md-editor/nohighlight'
import { Icon } from './ui/Icon'

const MARKDOWN_IMAGE_MAX_SIZE = 4 * 1024 * 1024
const MARKDOWN_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'

type MarkdownImageOptions = {
  uploadImage?: (file: File) => Promise<string>
  onError?: (message: string) => void
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

const fileToDataUrl = (file: File) => (
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('이미지를 읽지 못했습니다.'))
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
  const prefix = before.length === 0 || before.endsWith('\n\n')
    ? ''
    : before.endsWith('\n')
      ? '\n'
      : '\n\n'
  const suffix = after.length === 0 || after.startsWith('\n\n')
    ? ''
    : after.startsWith('\n')
      ? '\n'
      : '\n\n'
  const insertion = `${prefix}${markdown}${suffix}`

  return {
    value: `${before}${insertion}${after}`,
    cursor: before.length + insertion.length,
  }
}

function insertMarkdownWithApi(api: TextAreaTextApi, state: TextState, markdown: string) {
  const selection = {
    start: api.textArea.selectionStart ?? state.selection.start,
    end: api.textArea.selectionEnd ?? state.selection.end,
  }
  const result = insertMarkdownBlockAtRange(api.textArea.value, markdown, selection.start, selection.end)

  api.setSelectionRange(selection)
  api.replaceSelection(result.value.slice(selection.start, result.cursor))
  api.setSelectionRange({ start: result.cursor, end: result.cursor })
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
    execute: (state, api) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = MARKDOWN_IMAGE_ACCEPT
      input.multiple = true

      input.addEventListener('change', async () => {
        try {
          if (!input.files || input.files.length === 0) return
          const markdown = await createMarkdownImagesText(input.files, options)
          if (markdown) insertMarkdownWithApi(api, state, markdown)
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
  if (files.length === 0) return null

  event.preventDefault()
  return createMarkdownImagesText(files, options)
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
