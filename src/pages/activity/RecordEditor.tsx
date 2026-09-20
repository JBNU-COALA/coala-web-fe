import { ParticipantPicker } from './ParticipantPicker'
import { ActivityPhotos } from './ActivityPhotos'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import {
  activityToday,
  attendanceCounts,
  type ActivityData,
  type StudyRecord,
  type AttendanceEntry
} from '../../shared/activity'
import { AttendanceList } from './AttendanceList'

export function RecordEditor({
  data,
  record,
  onSave,
  back,
  initialGroup
}: {
  data: ActivityData
  record?: StudyRecord
  onSave: (record: StudyRecord) => Promise<void>
  back: string
  initialGroup: string
}) {
  const firstGroup =
    data.groups.find((group) => group.id === initialGroup)
  const [groupId, setGroupId] = useState(
    record?.groupId ?? firstGroup?.id ?? ''
  )
  const [title, setTitle] = useState(record?.title ?? '')
  const [date, setDate] = useState(record?.date ?? activityToday())
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
    date !== (record?.date ?? activityToday()) ||
    groupId !== (record?.groupId ?? firstGroup?.id ?? '') ||
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
    if (date > activityToday()) {
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
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '기록을 저장하지 못했습니다.'
      )
      setSaving(false)
    }
  }

  return (
    <>
      <Link
        className="study-back"
        to={back}
        onClick={(event) => {
          if (dirty && !window.confirm('작성 중인 내용을 취소할까요?'))
            event.preventDefault()
        }}
      >
        <Icon name="chevron-left" size={18} />
        활동 기록
      </Link>
      <header className="study-page-heading">
        <h1>{record ? '활동 수정' : '활동 등록'}</h1>
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
            <label>
              연결할 조 (선택)
              <select
                value={groupId}
                disabled={!!record?.groupId}
                onChange={(event) => {
                  const next = data.groups.find(
                    (group) => group.id === event.target.value
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
              >
                <option value="">연결 안 함</option>
                {record?.groupId && !data.groups.some((group) => group.id === record.groupId) && (
                  <option value={record.groupId}>기존 연결 유지</option>
                )}
                {data.groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ParticipantPicker selected={attendance} onAdd={(member) => setAttendance((current) =>
            current.length >= 200 || current.some((entry) => entry.userId === member.userId)
              ? current : [...current, { ...member, status: 'unknown' }])} />
          {attendance.length > 0 && <>
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
          <p className="study-unchecked" role="status">
            {attendanceCounts(attendance).unknown
              ? `미확인 ${attendanceCounts(attendance).unknown}명`
              : '모든 출석 상태를 확인했습니다.'}
          </p>
          </>}
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
          <button className="study-primary study-submit" type="submit" disabled={uploading}>
            {saving ? '저장 중...' : '기록 저장'}
          </button>
        </fieldset>
      </form>
    </>
  )
}
