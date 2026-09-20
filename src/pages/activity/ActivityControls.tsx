import { Icon } from '../../shared/ui/Icon'
import { SectionNav } from '../../shared/ui/SectionNav'
import { parseDate, shiftDate, type StudyGroup } from '../../shared/activity'

type ActivityControlsProps = {
  groups: StudyGroup[]
  start: string
  end: string
  selectedGroup: string
  layout: 'card' | 'calendar'
  view: 'records' | 'attendance'
  onFilter: (name: string, value: string) => void
  onToday: () => void
}

const formattedDate = (value: string) =>
  parseDate(value)?.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }) ?? value

export function ActivityControls({
  groups,
  start,
  end,
  selectedGroup,
  layout,
  view,
  onFilter,
  onToday,
}: ActivityControlsProps) {
  return (
    <>
      <div className="study-controls">
        {layout === 'card' || view === 'attendance' ? (
          <div className="study-week">
            <button
              className="study-icon-button"
              aria-label="이전 주"
              title="이전 주"
              onClick={() => onFilter('week', shiftDate(start, -7))}
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <div aria-live="polite">
              <strong>
                {parseDate(start)?.getFullYear()}년{' '}
                {parseDate(start)!.getMonth() + 1}월{' '}
                {parseDate(start)!.getDate()}일 주간
              </strong>
              <span>
                {formattedDate(start)} ~ {formattedDate(end)}
              </span>
            </div>
            <button
              className="study-icon-button"
              aria-label="다음 주"
              title="다음 주"
              onClick={() => onFilter('week', shiftDate(start, 7))}
            >
              <Icon name="chevron-right" size={20} />
            </button>
          </div>
        ) : null}
        <div className="study-group-filter">
          <button className="study-text-button" onClick={onToday}>
            오늘
          </button>
          <select
            aria-label="활동 조"
            value={selectedGroup}
            onChange={(event) => onFilter('group', event.target.value)}
          >
            <option value="all">전체 조</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="study-view-toolbar">
        <SectionNav
          label="활동 보기"
          items={[
            { id: 'attendance', label: '출석 체크' },
            { id: 'records', label: '활동 기록' },
          ]}
          value={view}
          onChange={(value) => onFilter('view', value)}
        />
        {view === 'records' && (
          <div
            className="study-layout-toggle"
            role="group"
            aria-label="활동 보기 방식"
          >
            <button
              title="카드형"
              aria-label="카드형"
              aria-pressed={layout === 'card'}
              onClick={() => onFilter('layout', 'card')}
            >
              <Icon name="layout" size={18} />
            </button>
            <button
              title="캘린더형"
              aria-label="캘린더형"
              aria-pressed={layout === 'calendar'}
              onClick={() => onFilter('layout', 'calendar')}
            >
              <Icon name="calendar" size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
