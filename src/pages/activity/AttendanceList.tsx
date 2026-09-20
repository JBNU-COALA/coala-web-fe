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
  onChange
}: {
  entries: AttendanceEntry[]
  onChange?: (entries: AttendanceEntry[]) => void
}) {
  return (
    <ul className="study-attendance-list">
      {entries.map((member) => (
        <li key={member.userId}>
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
            <select
              aria-label={`${member.name} 출석 상태`}
              className={`study-status-select study-status--${member.status}`}
              value={member.status}
              onChange={(event) =>
                onChange(
                  entries.map((entry) =>
                    entry.userId === member.userId
                      ? {
                          ...entry,
                          status: event.target.value as AttendanceStatus
                        }
                      : entry
                  )
                )
              }
            >
              {Object.entries(attendanceLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <span className={`study-status study-status--${member.status}`}>
              {attendanceLabels[member.status]}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
