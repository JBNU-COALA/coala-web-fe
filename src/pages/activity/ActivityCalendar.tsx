import {
  dateKey,
  mondayOf,
  parseDate,
  shiftDate,
  type StudyRecord
} from '../../shared/activity'
import { Icon } from '../../shared/ui/Icon'

export function ActivityCalendar({
  date,
  records,
  onSelect
}: {
  date: string
  records: StudyRecord[]
  onSelect: (date: string) => void
}) {
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
              aria-label={`${day}, 활동 ${events.length}건`}
              aria-pressed={day === date}
              aria-current={day === dateKey(new Date()) ? 'date' : undefined}
              onClick={() => onSelect(day)}
            >
              <span>{parseDate(day)!.getDate()}</span>
              <span className="study-calendar-dots" aria-hidden="true">
                {events.slice(0, 3).map((record) => (
                  <i
                    key={record.id}
                    className={`study-dot--${record.groupId}`}
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
