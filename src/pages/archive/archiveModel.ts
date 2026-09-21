import type { ArchiveCategory, ArchiveItem, ArchiveItemPayload } from '../../shared/api/archive'
import type { AttachmentUploadResponse } from '../../shared/api/attachments'
import { resolveApiAssetUrl } from '../../shared/api/client'

export type ArchiveDraft = {
  category: ArchiveCategory
  title: string
  summary: string
  labName: string
  eventDate: string
  materialType: string
  content: string
  sourceUrl: string
  repositoryUrl: string
  tags: string
}

export type ArchiveCalendarDay = {
  dateKey: string
  day: number
  inMonth: boolean
}

export const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']

const materialLabelByType: Record<string, string> = {
  SEMINAR: '세미나',
  PAPER: '논문',
  OTHER: '기타',
  SKILL: '스킬',
  AGENT: '에이전트',
}

export function resolveArchiveCategory(pathname: string): ArchiveCategory {
  if (pathname.startsWith('/archive/agents') || pathname.startsWith('/archive/skills')) return 'agents'
  return 'labs'
}

export function toPayload(draft: ArchiveDraft): ArchiveItemPayload {
  return {
    category: draft.category,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    labName: draft.labName.trim() || undefined,
    eventDate: draft.eventDate || undefined,
    materialType: draft.materialType,
    content: draft.content.trim(),
    sourceUrl: draft.sourceUrl.trim(),
    repositoryUrl: draft.repositoryUrl.trim(),
    tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
  }
}

export function itemToDraft(item: ArchiveItem): ArchiveDraft {
  return {
    category: item.category,
    title: item.title,
    summary: item.summary,
    labName: item.labName ?? '',
    eventDate: item.eventDate ?? '',
    materialType: item.materialType || (item.category === 'labs' ? 'SEMINAR' : 'SKILL'),
    content: item.content,
    sourceUrl: item.sourceUrl,
    repositoryUrl: item.repositoryUrl,
    tags: item.tags.join(', '),
  }
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function currentMonthKey() {
  return toLocalDateKey(new Date()).slice(0, 7)
}

export const emptyDraft = (category: ArchiveCategory): ArchiveDraft => ({
  category,
  title: '',
  summary: '',
  labName: '',
  eventDate: category === 'labs' ? toLocalDateKey(new Date()) : '',
  materialType: category === 'labs' ? 'SEMINAR' : 'SKILL',
  content: '',
  sourceUrl: '',
  repositoryUrl: '',
  tags: '',
})

export function getArchiveItemDate(item: ArchiveItem) {
  return item.eventDate || ''
}

export function formatArchiveDay(dateKey: string) {
  if (!dateKey) return '날짜 없음'
  const parsed = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateKey
  return parsed.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export function formatArchiveMonth(monthKey: string) {
  const parsed = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return monthKey
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })
}

export function shiftMonth(monthKey: string, amount: number) {
  const parsed = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return currentMonthKey()
  parsed.setMonth(parsed.getMonth() + amount)
  return toLocalDateKey(parsed).slice(0, 7)
}

export function buildCalendarDays(monthKey: string): ArchiveCalendarDay[] {
  const firstDay = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(firstDay.getTime())) return []

  const start = new Date(firstDay)
  start.setDate(1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const dateKey = toLocalDateKey(date)
    return {
      dateKey,
      day: date.getDate(),
      inMonth: dateKey.startsWith(monthKey),
    }
  })
}

export function getMaterialLabel(type?: string | null) {
  return materialLabelByType[(type || '').toUpperCase()] ?? '자료'
}

export function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim() || fileName
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

export function buildUploadedFileContent(uploaded: AttachmentUploadResponse) {
  return [
    `업로드 파일: ${uploaded.originalName}`,
    `파일 형식: ${uploaded.contentType}`,
    `파일 크기: ${formatFileSize(uploaded.fileSize)}`,
  ].join('\n')
}

export function getArchiveSourceHref(url: string) {
  if (!url) return ''
  const resolved = resolveApiAssetUrl(url)
  try {
    const parsed = new URL(resolved, window.location.origin)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''
  } catch { return '' }
}

