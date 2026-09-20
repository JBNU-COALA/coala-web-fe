import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { Icon } from '../../shared/ui/Icon'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { routes } from '../../shared/routes'
import {
  dateKey,
  mondayOf,
  shiftDate,
  parseDate,
  type ActivityData,
  type StudyRecord
} from '../../shared/activity'
import {
  loadActivityData,
  saveActivityRecord
} from '../../shared/activityRepository'
import { RequireAuth } from '../../shared/auth/RequireAuth'
import { AttendanceList, AttendanceSummary } from './AttendanceList'
import { ActivityCalendar } from './ActivityCalendar'
import { RecordEditor } from './RecordEditor'
import { toPlainContentPreview } from '../../shared/contentPreview'
import { prepareMarkdownForDisplay, rewriteMarkdownImageUrls } from '../../shared/markdown'
import { resolveApiAssetUrl } from '../../shared/api/client'
import './activity.css'

const root = routes.community.activity
const formattedDate = (value: string) =>
  parseDate(value)?.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  }) ?? value

export function StudyActivityPage({
  mode = 'list'
}: {
  mode?: 'list' | 'detail' | 'new' | 'edit'
}) {
  return (
    <RequireAuth>
      <ActivityContent mode={mode} />
    </RequireAuth>
  )
}

function ActivityContent({
  mode
}: {
  mode: 'list' | 'detail' | 'new' | 'edit'
}) {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState<ActivityData | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const start = mondayOf(params.get('week') ?? dateKey(new Date()))
  const anchor = parseDate(params.get('day') ?? '') ? params.get('day')! : start
  useEffect(() => {
    let active = true
    loadActivityData(anchor, recordId)
      .then((value) => {
        if (active) {
          setData(value)
          setError('')
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : '활동 기록을 불러오지 못했습니다.'
          )
      })
    return () => {
      active = false
    }
  }, [reload, anchor, recordId])

  const end = shiftDate(start, 6)
  const selectedGroup = data?.groups.some(
    (group) => group.id === params.get('group')
  )
    ? params.get('group')!
    : 'all'
  const view = params.get('view') === 'attendance' ? 'attendance' : 'records'
  const layout = params.get('layout') === 'calendar' ? 'calendar' : 'card'
  const selectedDate = parseDate(params.get('day') ?? '')
    ? params.get('day')!
    : start
  const selectedUser = params.get('user')
  const search = params.size ? `?${params.toString()}` : ''
  const back = `${root}${search}`
  const updateFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value === 'all' || value === 'records') next.delete(name)
    else next.set(name, value)
    if (name === 'week') next.set('day', value)
    setParams(next)
  }
  const record = data?.records.find((entry) => entry.id === recordId)
  const manageableGroups =
    data?.groups.filter((group) => group.canManage) ?? []
  const canEdit = record?.canManage
  const filteredRecords = (data?.records ?? []).filter(
    (entry) =>
      (selectedGroup === 'all' || entry.groupId === selectedGroup) &&
      (!selectedUser ||
        entry.attendance.some((member) => member.userId === selectedUser))
  )
  const records = filteredRecords
    .filter((entry) =>
      layout === 'calendar' && view === 'records'
        ? entry.date === selectedDate
        : entry.date >= start && entry.date <= end
    )
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        right.updatedAt.localeCompare(left.updatedAt)
    )
  const groupName = (id: string) =>
    data?.groups.find((group) => group.id === id)?.name ?? '알 수 없는 조'
  const sourceRecruit =
    record &&
    data?.groups.find((group) => group.id === record.groupId)?.recruitId

  const save = async (value: StudyRecord) => {
    const updated = await saveActivityRecord(value, mode === 'edit')
    setData(
      (current) =>
        current && {
          ...current,
          records: [
            updated,
            ...current.records.filter((entry) => entry.id !== updated.id)
          ]
        }
    )
    const next = new URLSearchParams(params)
    next.set('week', mondayOf(updated.date))
    next.set('group', updated.groupId)
    next.set('day', updated.date)
    next.delete('view')
    navigate(
      `${routes.community.activityRecord(updated.id)}?${next.toString()}`,
      { replace: true }
    )
  }

  return (
    <section className={`study-page study-page--${mode}`}>
      {error ? (
        <div className="study-empty">
          <h1>활동</h1>
          <p role="alert">{error}</p>
          {
            <button
              className="study-text-button"
              onClick={() => setReload((value) => value + 1)}
            >
              다시 불러오기
            </button>
          }
        </div>
      ) : !data ? (
        <p className="study-empty" role="status">
          활동 기록을 불러오는 중입니다.
        </p>
      ) : mode === 'new' || mode === 'edit' ? (
        mode === 'edit' && !record ? (
          <div className="study-empty">
            <p>활동 기록을 찾을 수 없습니다.</p>
            <Link to={back}>목록으로 돌아가기</Link>
          </div>
        ) : !manageableGroups.length || (mode === 'edit' && !canEdit) ? (
          <div className="study-empty">
            <p>공고 작성자와 관리자만 활동을 기록할 수 있습니다.</p>
            <Link to={back}>목록으로 돌아가기</Link>
          </div>
        ) : (
          <RecordEditor
            key={record?.id ?? 'new'}
            data={{ ...data, groups: manageableGroups }}
            record={record}
            initialGroup={selectedGroup}
            onSave={save}
            back={back}
          />
        )
      ) : mode === 'detail' ? (
        !record ? (
          <div className="study-empty">
            <p>활동 기록을 찾을 수 없습니다.</p>
            <Link to={back}>목록으로 돌아가기</Link>
          </div>
        ) : (
          <>
            <Link className="study-back" to={back}>
              <Icon name="chevron-left" size={18} />
              목록으로 돌아가기
            </Link>
            <header className="study-detail-heading">
              <div className="study-detail-context">
                <Link
                  className={`study-group study-group--${record.groupId}`}
                  to={routes.community.activityGroup(record.groupId)}
                >
                  {groupName(record.groupId)}
                </Link>
                {sourceRecruit && (
                  <Link
                    className="study-text-button"
                    to={routes.community.recruitNotice(sourceRecruit)}
                  >
                    모집 공고
                    <Icon name="chevron-right" size={16} />
                  </Link>
                )}
              </div>
              <h1>{record.title}</h1>
              <div className="study-detail-meta">
                <time dateTime={record.date}>{formattedDate(record.date)}</time>
                {canEdit && (
                  <Link
                    className="study-text-button"
                    to={`${routes.community.activityRecordEditor(record.id)}${search}`}
                  >
                    <Icon name="edit" size={16} />
                    수정
                  </Link>
                )}
              </div>
            </header>
            <div className="study-detail-layout">
              <article className="study-body" data-color-mode="light">
                <MDEditor.Markdown source={rewriteMarkdownImageUrls(prepareMarkdownForDisplay(record.content), resolveApiAssetUrl)} skipHtml />
              </article>
              <section
                className="study-detail-attendance"
                aria-label="출석 명단"
              >
                <div className="study-form-section">
                  <h2>
                    출석 <small>{record.attendance.length}명</small>
                  </h2>
                </div>
                <AttendanceSummary entries={record.attendance} />
                <AttendanceList entries={record.attendance} />
              </section>
            </div>
          </>
        )
      ) : (
        <>
          <header className="study-page-heading">
            <h1>활동</h1>
            {manageableGroups.length > 0 && (
              <Link
                className="study-primary"
                to={`${routes.community.activityRecordNew}${search}`}
              >
                <Icon name="plus" size={18} />
                기록 작성
              </Link>
            )}
          </header>
          {selectedUser && (
            <div className="study-user-filter">
              <span>
                {data.groups
                  .flatMap((group) => group.members)
                  .find((member) => member.userId === selectedUser)?.name ??
                  '사용자'}
                의 활동
              </span>
              <button
                className="study-text-button"
                onClick={() => updateFilter('user', 'all')}
              >
                전체 활동 보기
              </button>
            </div>
          )}
          <div className="study-controls">
            {layout === 'card' || view === 'attendance' ? (
              <div className="study-week">
                <button
                  className="study-icon-button"
                  aria-label="이전 주"
                  title="이전 주"
                  onClick={() => updateFilter('week', shiftDate(start, -7))}
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
                  onClick={() => updateFilter('week', shiftDate(start, 7))}
                >
                  <Icon name="chevron-right" size={20} />
                </button>
              </div>
            ) : null}
            <div className="study-group-filter">
              <button
                className="study-text-button"
                onClick={() => {
                  const next = new URLSearchParams(params)
                  next.set('week', mondayOf(dateKey(new Date())))
                  next.set('day', dateKey(new Date()))
                  setParams(next)
                }}
              >
                오늘
              </button>
              <select
                aria-label="활동 조"
                value={selectedGroup}
                onChange={(event) => updateFilter('group', event.target.value)}
              >
                <option value="all">전체 조</option>
                {data.groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="study-view-toolbar">
            <nav className="study-view-tabs" aria-label="활동 보기">
              <button
                aria-current={view === 'records' ? 'page' : undefined}
                onClick={() => updateFilter('view', 'records')}
              >
                활동 기록
              </button>
              <button
                aria-current={view === 'attendance' ? 'page' : undefined}
                onClick={() => updateFilter('view', 'attendance')}
              >
                출석 현황
              </button>
            </nav>
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
                  onClick={() => updateFilter('layout', 'card')}
                >
                  <Icon name="layout" size={18} />
                </button>
                <button
                  title="캘린더형"
                  aria-label="캘린더형"
                  aria-pressed={layout === 'calendar'}
                  onClick={() => updateFilter('layout', 'calendar')}
                >
                  <Icon name="calendar" size={18} />
                </button>
              </div>
            )}
          </div>
          {layout === 'calendar' && view === 'records' && (
            <>
              <ActivityCalendar
                date={selectedDate}
                records={filteredRecords}
                onSelect={(day) => {
                  const next = new URLSearchParams(params)
                  next.set('day', day)
                  next.set('week', mondayOf(day))
                  setParams(next)
                }}
              />
              <h2 className="study-day-heading">
                {formattedDate(selectedDate)}
              </h2>
            </>
          )}
          {records.length === 0 ? (
            <div className="study-empty">
              <Icon name="calendar" size={28} />
              <h2>선택한 기간에 활동 기록이 없습니다.</h2>
              <p>다른 날짜의 기록을 확인해 보세요.</p>
              {manageableGroups.length > 0 && (
                <Link
                  className="study-text-button"
                  to={`${routes.community.activityRecordNew}${search}`}
                >
                  기록 작성
                  <Icon name="chevron-right" size={16} />
                </Link>
              )}
            </div>
          ) : view === 'records' ? (
            <ol className={`study-feed study-feed--${layout}`}>
              {records.map((entry) => (
                <li key={entry.id}>
                  <time dateTime={entry.date}>{formattedDate(entry.date)}</time>
                  <article>
                    <Link
                      className="study-record-link"
                      to={`${routes.community.activityRecord(entry.id)}${search}`}
                    >
                      <span
                        className={`study-group study-group--${entry.groupId}`}
                      >
                        {groupName(entry.groupId)}
                      </span>
                      <h2>{entry.title}</h2>
                      <p>{toPlainContentPreview(entry.content)}</p>
                    </Link>
                    <div className="study-record-footer">
                      <div
                        className="study-avatar-stack"
                        aria-label={`참여자 ${entry.attendance.length}명`}
                      >
                        {entry.attendance.slice(0, 4).map((person) => (
                          <CharacterAvatar
                            key={person.userId}
                            name={person.name}
                            seed={person.userId}
                            size="xs"
                          />
                        ))}
                        {entry.attendance.length > 4 && (
                          <span>+{entry.attendance.length - 4}</span>
                        )}
                      </div>
                      <AttendanceSummary entries={entry.attendance} />
                    </div>
                    {data.groups.find((group) => group.id === entry.groupId)
                      ?.recruitId && (
                      <Link
                        className="study-source-link"
                        to={routes.community.recruitNotice(
                          data.groups.find(
                            (group) => group.id === entry.groupId
                          )!.recruitId!
                        )}
                      >
                        모집 공고
                        <Icon name="chevron-right" size={14} />
                      </Link>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <div className="study-overview">
              <p className="study-overview-caption">
                선택한 주의 활동 {records.length}회 기준 · 각 숫자는 해당 상태로
                기록된 횟수입니다.
              </p>
              {data.groups
                .filter((group) =>
                  records.some((entry) => entry.groupId === group.id)
                )
                .map((group) => {
                  const groupRecords = records.filter(
                    (entry) => entry.groupId === group.id
                  )
                  const roster = [
                    ...new Map(
                      groupRecords
                        .flatMap((entry) => entry.attendance)
                        .map((member) => [member.userId, member])
                    ).values()
                  ]
                  return (
                    <section className="study-group-overview" key={group.id}>
                      <header>
                        <h2>{group.name}</h2>
                        <span>{groupRecords.length}회 활동</span>
                      </header>
                      <ul>
                        {roster
                          .filter(
                            (member) =>
                              !selectedUser || member.userId === selectedUser
                          )
                          .map((member) => {
                            const entries = groupRecords.flatMap((entry) =>
                              entry.attendance.filter(
                                (person) => person.userId === member.userId
                              )
                            )
                            return (
                              <li key={member.userId}>
                                <CharacterAvatar
                                  name={member.name}
                                  seed={member.userId}
                                  size="sm"
                                />
                                <strong>{member.name}</strong>
                                <AttendanceSummary entries={entries} />
                              </li>
                            )
                          })}
                      </ul>
                    </section>
                  )
                })}
            </div>
          )}
        </>
      )}
    </section>
  )
}
