import { useState } from 'react'
import { Link } from 'react-router-dom'
import { attendanceCounts, type StudyRecord } from '../../shared/activity'
import { routes } from '../../shared/routes'
import { AttendanceList, AttendanceSummary } from './AttendanceList'
import { ActivityPhotos } from './ActivityPhotos'

export function AttendanceSession({ record, groupName, onSave }: {
  record: StudyRecord
  groupName: string
  onSave: (record: StudyRecord) => Promise<void>
}) {
  const [entries, setEntries] = useState(record.attendance)
  const [photos, setPhotos] = useState(record.photos ?? [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const counts = attendanceCounts(entries)
  const checked = entries.length - counts.unknown
  const dirty = entries.some((entry) => record.attendance.find((member) => member.userId === entry.userId)?.status !== entry.status)
    || entries.length !== record.attendance.length
    || photos.map((photo) => photo.attachmentId).join(',') !== (record.photos ?? []).map((photo) => photo.attachmentId).join(',')
  const save = async () => {
    if (saving || uploading) return
    setSaving(true)
    setError('')
    setSaved(false)
    try { await onSave({ ...record, attendance: entries, photos }); setSaved(true) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '출석을 저장하지 못했습니다.') }
    finally { setSaving(false) }
  }
  return <section className="attendance-session">
    <header className="attendance-session-heading">
      <div><span>{groupName} · <time dateTime={record.date}>{record.date}</time></span>
        <h3><Link to={routes.community.activityRecord(record.id)}>{record.title}</Link></h3></div>
      {entries.length > 0 && <span className="attendance-progress">{checked}/{entries.length}명 확인</span>}
    </header>
    <fieldset disabled={saving}>
      {entries.length > 0 ? <>
        <div className="attendance-session-summary"><AttendanceSummary entries={entries} />
          {record.canManage && <button type="button" className="study-text-button"
            onClick={() => setEntries(entries.map((entry) => ({ ...entry, status: 'present' })))}>전체 출석</button>}</div>
        <AttendanceList entries={entries} onChange={record.canManage ? setEntries : undefined} />
      </> : <p className="attendance-no-roster">연결된 출석 명단이 없습니다.
        {record.canManage && <Link to={routes.community.activityRecordEditor(record.id)}>조 연결</Link>}</p>}
      <ActivityPhotos photos={photos} onChange={record.canManage ? setPhotos : undefined} onBusy={setUploading} />
      {error && <p className="study-error" role="alert">{error}</p>}
      {record.canManage && <footer>
        <span role="status">{dirty ? '변경 사항이 있습니다' : saved ? '저장했습니다' : ''}</span>
        <button className="study-primary" type="button" disabled={!dirty || saving || uploading} onClick={() => void save()}>
          {saving ? '저장 중...' : '출석 저장'}</button>
      </footer>}
    </fieldset>
  </section>
}
