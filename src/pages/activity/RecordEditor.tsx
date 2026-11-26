import { SelectControl } from '../../shared/ui/SelectControl'
import { ParticipantPicker } from './ParticipantPicker'
import { ActivityPhotos } from './ActivityPhotos'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import {
  activityToday,
  parseDate,
  type ActivityData,
  type StudyRecord,
  type AttendanceEntry
} from '../../shared/activity'
import { AttendanceList } from './AttendanceList'
import posthog, { isPostHogConfigured } from '../../posthog'

export function RecordEditor({
  data,
  record,
  onSave,
  back,
  initialGroup,
  initialDate = activityToday()
}: {
  data: ActivityData
  record?: StudyRecord
  onSave: (record: StudyRecord) => Promise<void>
  back: string
  initialGroup: string
  initialDate?: string
}) {
  const firstGroup =
    data.groups.find((group) => group.id === initialGroup)
  const [groupId, setGroupId] = useState(
    record ? record.groupId ?? '' : firstGroup?.id ?? ''
  )
  const [title, setTitle] = useState(record?.title ?? '')
  const defaultDate = parseDate(initialDate) && initialDate <= activityToday() ? initialDate : activityToday()
  const [date, setDate] = useState(record?.date ?? defaultDate)
  const [content, setContent] = useState(record?.content ?? '')
  const [attendance, setAttendance] = useState<AttendanceEntry[]>(
    record?.attendance ??
      firstGroup?.members.map((member) => ({ ...member, status: 'unknown' })) ??
      []
  )
  const [photos, setPhotos] = useState(record?.photos ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dirty =
    JSON.stringify(photos) !== JSON.stringify(record?.photos ?? []) ||
    title !== (record?.title ?? '') ||
    content !== (record?.content ?? '') ||
    date !== (record?.date ?? defaultDate) ||
    groupId !== (record ? record.groupId ?? '' : firstGroup?.id ?? '') ||
    JSON.stringify(attendance) !==
      JSON.stringify(
        record?.attendance ??
          firstGroup?.members.map((member) => ({
            ...member,
            status: 'unknown'
          })) ?? []
      )

  useEffect(() => {
    if (!dirty) return
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving || uploading) return
    if (!title.trim() || !content.trim()) {
      setError('제목과 활동 내용을 입력해 주세요.')
      return
    }
    if (!parseDate(date) || date > activityToday()) {
      setError('활동을 진행한 날짜를 선택해 주세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        id: record?.id ?? crypto.randomUUID(),
        groupId: groupId || null,
        title: title.trim(),
        date,
        content: content.trim(),
        attendance,
        photos,
        updatedAt: new Date().toISOString(),
        version: record?.version
      })
      if (isPostHogConfigured) posthog.capture(record ? 'activity_record_updated' : 'activity_record_created', { attendance_count: attendance.length, photo_count: photos.length, has_group: Boolean(groupId) })
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '기록을 저장하지 못했습니다.'
      )
      setSaving(false)
    }
  }

  return (
    <div className="record-editor-page">
      <Link
        className="study-back"
        to={back}
        onClick={(event) => {
          if (dirty && !window.confirm('작성 중인 내용을 취소할까요?'))
            event.preventDefault()
        }}
      >
        <Icon name="chevron-left" size={18} />
        목록으로 돌아가기
      </Link>
      <header className="study-page-heading">
        <h1>{record ? '출석 수정' : '출석 체크'}</h1>
      </header>
      <form className="study-editor" onSubmit={submit}>
        <fieldset disabled={saving}>
          <label>
            제목
            <input
              autoFocus
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="활동 제목을 입력해 주세요"
            />
          </label>
          <div className="study-editor-fields">
            <label>
              날짜
              <input
                type="date"
                required
                max={activityToday()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <div className="study-editor-field">
              <span>연결할 조 (선택)</span>
              <SelectControl label="연결할 조 (선택)" className="study-editor-group"
                options={[{ value: '', label: '연결 안 함' },
                  ...(record?.groupId && !data.groups.some((group) => group.id === record.groupId) ? [{ value: record.groupId, label: '기존 연결 유지' }] : []),
                  ...data.groups.map((group) => ({ value: group.id, label: group.name }))]}

                value={groupId}
                disabled={!!record?.groupId}
                onChange={(value) => {
                  const next = data.groups.find(
                    (group) => group.id === value
                  )
                  const merged = [...attendance]
                  for (const member of next?.members ?? []) {
                    if (!merged.some((entry) => entry.userId === member.userId))
                      merged.push({ ...member, status: 'unknown' })
                  }
                  if (merged.length > 200) {
                    setError('참여자는 최대 200명까지 추가할 수 있습니다.')
                    return
                  }
                  setGroupId(next?.id ?? '')
                  setAttendance(merged)
                }}
              />
            </div>
          </div>
          <ParticipantPicker selected={attendance} onAdd={(member) => setAttendance((current) =>
            current.length >= 200 || current.some((entry) => entry.userId === member.userId)
              ? current : [...current, { ...member, status: 'unknown' }])} />
          {attendance.length > 0 && <section className="study-editor-attendance">
          <div className="study-form-section">
            <h2>
              출석 <small>{attendance.length}명</small>
            </h2>
            <button
              type="button"
              className="study-text-button"
              onClick={() =>
                setAttendance(
                  attendance.map((entry) => ({ ...entry, status: 'present' }))
                )
              }
            >
              전체 출석
            </button>
          </div>
          <AttendanceList entries={attendance} onChange={setAttendance}
            onRemove={(userId) => setAttendance((current) => current.filter((entry) => entry.userId !== userId))} />

          </section>}
          <label>
            오늘 어떤 활동을 했나요?
            <textarea
              required
              rows={4}
              maxLength={20000}
              aria-label="오늘 어떤 활동을 했나요?"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="함께 배운 내용, 진행한 작업, 다음 모임의 계획"
            />
          </label>
          <ActivityPhotos photos={photos} onChange={setPhotos} onBusy={setUploading} />
          {error && (
            <p className="study-error" role="alert">
              {error}
            </p>
          )}
          <div className="study-editor-footer">
          <button className="study-primary study-submit" type="submit" disabled={uploading}>
            {saving ? '저장 중...' : '저장'}
          </button>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
