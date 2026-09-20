import { useId } from 'react'
import {
  attendanceLabels,
  attendanceCounts,
  type AttendanceEntry,
  type AttendanceStatus
} from '../../shared/activity'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { Link } from 'react-router-dom'
import { routes } from '../../shared/routes'

export function AttendanceSummary({ entries }: { entries: AttendanceEntry[] }) {
  const counts = attendanceCounts(entries)
  return (
    <span className="study-attendance-summary">
      {Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => (
          <span key={status} className={`study-status study-status--${status}`}>
            {attendanceLabels[status as AttendanceStatus]} {count}
          </span>
        ))}
    </span>
  )
}

export function AttendanceList({
  entries,
  onChange,
  onRemove
}: {
  entries: AttendanceEntry[]
  onChange?: (entries: AttendanceEntry[]) => void
  onRemove?: (userId: string) => void
}) {
  const id = useId()
  return (
    <ul className="study-attendance-list">
      {entries.map((member) => (
        <li key={member.userId} className={onRemove ? 'is-removable' : undefined}>
          <CharacterAvatar name={member.name} seed={member.userId} size="sm" />
          {onChange ? (
            <span className="study-person-name">{member.name}</span>
          ) : (
            <Link
              className="study-person-name"
              to={routes.users.detail(member.userId)}
            >
              {member.name}
            </Link>
          )}
          {onChange ? (
            <div className="attendance-choices" role="radiogroup" aria-label={`${member.name} 출석 상태`}>
              {Object.entries(attendanceLabels).map(([value, label]) => (
                <label key={value} className={`attendance-choice attendance-choice--${value}`}>
                  <input type="radio" name={`${id}-${member.userId}`} value={value}
                    checked={member.status === value}
                    onChange={() => onChange(entries.map((entry) => entry.userId === member.userId
                      ? { ...entry, status: value as AttendanceStatus } : entry))} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          ) : (
            <span className={`study-status study-status--${member.status}`}>
              {attendanceLabels[member.status]}
            </span>
          )}
          {onRemove && <button type="button" className="participant-remove" title="참여자 제외"
            aria-label={`${member.name} 참여자 제외`} onClick={() => onRemove(member.userId)}>×</button>}
        </li>
      ))}
    </ul>
  )
}
