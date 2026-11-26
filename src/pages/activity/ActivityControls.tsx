import { ListingControls } from '../../shared/ui/ListingControls'
import { Icon } from '../../shared/ui/Icon'
import { SelectControl } from '../../shared/ui/SelectControl'
import { parseDate, shiftDate, type StudyGroup } from '../../shared/activity'

type ActivityControlsProps = {
  groups: StudyGroup[]
  start: string
  end: string
  selectedGroup: string
  layout: 'card' | 'calendar'
  onFilter: (name: string, value: string) => void
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
  onFilter,
}: ActivityControlsProps) {
  return (
    <ListingControls label="활동 조회 필터" actions={<div className="study-view-toolbar">
        <div
            className="study-layout-toggle"
            role="group"
          aria-label="출석 체크 보기 방식"
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
      </div>}>
        {layout === 'card' ? (
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
          <SelectControl
            label="활동 조"
            className="study-group-select"
            value={selectedGroup}
            onChange={(value) => onFilter('group', value)}
            options={[
              { value: 'all', label: '전체 조' },
              ...(selectedGroup !== 'all' && !groups.some((group) => group.id === selectedGroup)
                ? [{ value: selectedGroup, label: '선택한 조' }] : []),
              ...groups.map((group) => ({ value: group.id, label: group.name })),
            ]}
          />
        </div>

    </ListingControls>
  )
}
