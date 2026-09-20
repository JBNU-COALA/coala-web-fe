import { Link } from 'react-router-dom'
import type { StudyRecord } from '../../shared/activity'
import { parseDate } from '../../shared/activity'
import { routes } from '../../shared/routes'
import { toPlainContentPreview } from '../../shared/contentPreview'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { Icon } from '../../shared/ui/Icon'
import { AttendanceSummary } from './AttendanceList'
import { ActivityPhotoPreview } from './ActivityPhotos'

export function AttendanceCard({ record, groupName, search, recruitId }: {
  record: StudyRecord
  groupName: string
  search: string
  recruitId?: string
}) {
  return <li>
    <article>
      <Link className="study-record-link" to={routes.community.activityRecord(record.id) + search}>
        {record.photos?.[0] && <div className="study-card-photo">
          <ActivityPhotoPreview photo={record.photos[0]} />
          <span><Icon name="image" size={14} />{record.photos.length}</span>
        </div>}
        <div className="study-card-context">
          <span className="study-group">{groupName}</span>
          <time dateTime={record.date}>{parseDate(record.date)?.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}</time>
        </div>
        <h2>{record.title}</h2>
        <p>{toPlainContentPreview(record.content)}</p>
      </Link>
      <div className="study-record-footer">
        <div className="study-card-people">
          {record.attendance.slice(0, 3).map((person) => <Link key={person.userId}
            to={routes.users.detail(person.userId)} title={person.name + ' 프로필'}>
            <CharacterAvatar name={person.name} seed={person.userId} size="xs" /><span>{person.name}</span>
          </Link>)}
          {record.attendance.length > 3 && <span>외 {record.attendance.length - 3}명</span>}
          {!record.attendance.length && <span>등록된 참여자 없음</span>}
        </div>
        <AttendanceSummary entries={record.attendance} />
      </div>
      {recruitId && <Link className="study-source-link" to={routes.community.recruitNotice(recruitId)}>
        모집 공고<Icon name="chevron-right" size={14} />
      </Link>}
    </article>
  </li>
}
