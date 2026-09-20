import {
  dateKey,
  shiftDate,
  parseDate,
  attendanceLabels,
  type ActivityData,
  type StudyRecord,
  type StudyGroup
} from './activity'
import client from './api/client'

// Demo storage is compiled out of production. No simulated server success.
export const isActivityPreview = () =>
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('preview') === '1'
export const activityLink = (path: string) =>
  isActivityPreview()
    ? `${path}${path.includes('?') ? '&' : '?'}preview=1`
    : path
const storageKey = 'coala-study-activity-preview-v1'

function validRecord(value: unknown, data: ActivityData): value is StudyRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as StudyRecord
  const group = data.groups.find((entry) => entry.id === record.groupId)
  return (
    typeof record.id === 'string' &&
    !!record.id &&
    !!group &&
    typeof record.title === 'string' &&
    !!record.title.trim() &&
    record.title.length <= 120 &&
    typeof record.content === 'string' &&
    !!record.content.trim() &&
    record.content.length <= 20000 &&
    typeof record.date === 'string' &&
    !!parseDate(record.date) &&
    typeof record.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(record.updatedAt)) &&
    Array.isArray(record.attendance) &&
    record.attendance.length === group.members.length &&
    new Set(record.attendance.map((entry) => entry?.userId)).size ===
      group.members.length &&
    record.attendance.every(
      (entry) =>
        entry &&
        typeof entry.name === 'string' &&
        Object.hasOwn(attendanceLabels, entry.status) &&
        group.members.some((member) => member.userId === entry.userId)
    )
  )
}

export async function loadActivityGroups(): Promise<StudyGroup[]> {
  if (isActivityPreview()) return (await loadActivityData()).groups
  return (await client.get<StudyGroup[]>('/api/study/groups')).data
}

export async function createActivityGroup(recruitId: string, name: string) {
  return (
    await client.post<StudyGroup>('/api/study/groups', { recruitId, name })
  ).data
}

export async function loadActivityData(
  anchor = dateKey(new Date()),
  recordId?: string
): Promise<ActivityData> {
  if (!isActivityPreview()) {
    const groups = await loadActivityGroups()
    const records = (
      await client.get<StudyRecord[]>('/api/study/records', {
        params: { from: shiftDate(anchor, -42), to: shiftDate(anchor, 42) }
      })
    ).data
    if (recordId && !records.some((record) => record.id === recordId))
      records.push(
        (
          await client.get<StudyRecord>(
            `/api/study/records/${encodeURIComponent(recordId)}`
          )
        ).data
      )
    return { groups, records }
  }
  const { createStudyActivityDemo } = await import('../dummy/studyActivityData')
  const data = createStudyActivityDemo()
  const stored = localStorage.getItem(storageKey)
  if (!stored) return data
  try {
    const parsed: unknown = JSON.parse(stored)
    if (
      !Array.isArray(parsed) ||
      !parsed.every((item) => validRecord(item, data)) ||
      new Set(parsed.map((item) => item.id)).size !== parsed.length
    )
      throw new Error()
    return { ...data, records: parsed }
  } catch {
    throw new Error(
      '저장된 활동 기록을 읽지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'
    )
  }
}

export async function saveActivityRecord(
  record: StudyRecord,
  editing: boolean
): Promise<StudyRecord> {
  if (!isActivityPreview()) {
    const payload = {
      groupId: Number(record.groupId),
      title: record.title,
      date: record.date,
      content: record.content,
      version: record.version,
      attendance: record.attendance.map(({ userId, status }) => ({
        userId: Number(userId),
        status
      }))
    }
    try {
      return (
        editing
          ? await client.patch<StudyRecord>(
              `/api/study/records/${encodeURIComponent(record.id)}`,
              payload
            )
          : await client.post<StudyRecord>('/api/study/records', payload)
      ).data
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status
      throw new Error(
        status === 409
          ? '다른 사람이 먼저 수정했습니다. 작성 내용을 보관한 뒤 새로 불러와 주세요.'
          : status === 403
            ? '활동을 수정할 권한이 없습니다.'
            : '기록을 저장하지 못했습니다. 작성 내용은 화면에 남아 있습니다.'
      )
    }
  }
  const data = await loadActivityData()
  if (!validRecord(record, data))
    throw new Error('제목, 날짜, 활동 내용과 출석 명단을 확인해 주세요.')
  const records = [
    record,
    ...data.records.filter((item) => item.id !== record.id)
  ]
  try {
    localStorage.setItem(storageKey, JSON.stringify(records))
  } catch {
    throw new Error(
      '저장 공간이 부족하거나 브라우저 저장이 차단되었습니다. 작성 내용은 화면에 남아 있습니다.'
    )
  }
  return record
}
