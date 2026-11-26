import {
  dateKey,
  activityToday,
  mondayOf,
  parseDate,
  shiftDate,
  type StudyGroup,
  type StudyRecord
} from '../../shared/activity'
import { Icon } from '../../shared/ui/Icon'

export function ActivityCalendar({
  date,
  records,
  groups = [],
  onSelect
}: {
  date: string
  records: StudyRecord[]
  groups?: StudyGroup[]
  onSelect: (date: string) => void
}) {
  const groupIds = [...new Set([...groups.map((group) => group.id), ...records.flatMap((record) => record.groupId ? [record.groupId] : [])])].sort()
  const palette = ['#287d68', '#4366b0', '#a64f78', '#8460ad', '#a76b25', '#287f91', '#b65d4d', '#687d35']
  const colorFor = (id: string | null) => {
    if (!id) return '#737373'
    const index = groupIds.indexOf(id)
    return palette[index] ?? `hsl(${(index * 137.508) % 360} 65% 42%)`
  }
  const nameFor = (id: string | null) => groups.find((group) => group.id === id)?.name ?? (id ? '연결된 조' : '개별 활동')
  const visibleGroups = groupIds.filter((id) => records.some((record) => record.groupId === id))
  const selected = parseDate(date) ?? new Date()
  const monthStart = dateKey(
    new Date(selected.getFullYear(), selected.getMonth(), 1, 12)
  )
  const monthEnd = dateKey(
    new Date(selected.getFullYear(), selected.getMonth() + 1, 0, 12)
  )
  const first = mondayOf(monthStart)
  const days = Array.from({ length: 42 }, (_, index) => shiftDate(first, index))
  const shiftMonth = (offset: number) =>
    onSelect(
      dateKey(
        new Date(selected.getFullYear(), selected.getMonth() + offset, 1, 12)
      )
    )
  return (
    <section className="study-calendar" aria-label="활동 캘린더">
      <header>
        <button
          className="study-icon-button"
          title="이전 달"
          aria-label="이전 달"
          onClick={() => shiftMonth(-1)}
        >
          <Icon name="chevron-left" size={18} />
        </button>
        <h2 aria-live="polite">
          {selected.getFullYear()}년 {selected.getMonth() + 1}월
        </h2>
        <button
          className="study-icon-button"
          title="다음 달"
          aria-label="다음 달"
          onClick={() => shiftMonth(1)}
        >
          <Icon name="chevron-right" size={18} />
        </button>
      </header>
      <div className="study-calendar-legend" aria-label="팀별 활동 색상">
        {visibleGroups.map((id) => <span key={id}><i style={{ backgroundColor: colorFor(id) }} />{nameFor(id)}</span>)}
        {records.some((record) => !record.groupId) && <span><i style={{ backgroundColor: colorFor(null) }} />개별 활동</span>}
      </div>
      <div className="study-calendar-weekdays" aria-hidden="true">
        {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="study-calendar-days">
        {days.map((day) => {
          const events = records.filter((record) => record.date === day)
          return (
            <button
              key={day}
              className={`${day < monthStart || day > monthEnd ? 'is-outside' : ''} ${day === date ? 'is-selected' : ''}`}
              aria-label={`${day}, 활동 ${events.length}건${events.length ? `, ${events.map((event) => `${nameFor(event.groupId)}: ${event.title}`).join(", ")}` : ""}`}
              aria-pressed={day === date}
              aria-current={day === activityToday() ? 'date' : undefined}
              onClick={() => onSelect(day)}
            >
              <span>{parseDate(day)!.getDate()}</span>
              <span className="study-calendar-dots" aria-hidden="true">
                {events.slice(0, 3).map((record) => (
                  <i
                    key={record.id}
                    style={{ backgroundColor: colorFor(record.groupId) }}
                    title={`${nameFor(record.groupId)} · ${record.title}`}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
