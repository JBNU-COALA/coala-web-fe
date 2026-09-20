export const attendanceLabels = {
  present: '출석',
  late: '지각',
  absent: '결석',
  unknown: '미확인'
} as const
export type AttendanceStatus = keyof typeof attendanceLabels
export type StudyMember = { userId: string; name: string }
export type StudyGroup = {
  id: string
  name: string
  recruitId?: string
  members: StudyMember[]
  canManage?: boolean
}
export type AttendanceEntry = StudyMember & { status: AttendanceStatus }
export type ActivityPhoto = { attachmentId: number; originalName: string }
export type StudyRecord = {
  id: string
  groupId: string | null
  authorId?: string
  title: string
  date: string
  content: string
  photos?: ActivityPhoto[]
  attendance: AttendanceEntry[]
  updatedAt: string
  version?: number
  canManage?: boolean
}
export type ActivityData = { groups: StudyGroup[]; records: StudyRecord[]; groupsError?: string }

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && dateKey(date) === value ? date : null
}

export function mondayOf(value: string) {
  const date = parseDate(value) ?? new Date()
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return dateKey(date)
}

export function shiftDate(value: string, days: number) {
  const date = parseDate(value) ?? new Date()
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

export function attendanceCounts(entries: AttendanceEntry[]) {
  return entries.reduce(
    (counts, entry) => {
      counts[entry.status] += 1
      return counts
    },
    { present: 0, late: 0, absent: 0, unknown: 0 }
  )
}
