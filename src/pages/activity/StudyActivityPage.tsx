import { AttendanceSession } from './AttendanceSession'
import { ActivityPhotos } from './ActivityPhotos'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { Icon } from '../../shared/ui/Icon'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { routes } from '../../shared/routes'
import {
  activityToday,
  mondayOf,
  shiftDate,
  parseDate,
  type ActivityData,
  type StudyRecord
} from '../../shared/activity'
import {
  loadActivityData,
  loadActivityEditorData,
  deleteActivityRecord,
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
import { PageFrame } from '../../shared/ui/PageFrame'
import { ActivityControls } from './ActivityControls'

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
  const start = mondayOf(params.get('week') ?? activityToday())
  const anchor = parseDate(params.get('day') ?? '') ? params.get('day')! : start
  useEffect(() => {
    let active = true
    const loading = mode === 'new' || mode === 'edit'
      ? loadActivityEditorData(mode === 'edit' ? recordId : undefined)
      : loadActivityData(anchor, recordId)
    loading
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
  }, [reload, anchor, recordId, mode])

  const end = shiftDate(start, 6)
  const selectedGroup = data?.groups.some(
    (group) => group.id === params.get('group')
  )
    ? params.get('group')!
    : 'all'
  const view = params.get('view') === 'records' ? 'records' : 'attendance'
  const layout = params.get('layout') === 'calendar' ? 'calendar' : 'card'
  const selectedDate = parseDate(params.get('day') ?? '')
    ? params.get('day')!
    : start
  const selectedUser = params.get('user')
  const search = params.size ? `?${params.toString()}` : ''
  const back = `${root}${search}`
  const updateFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value === 'all' || (name === 'view' && value === 'attendance')) next.delete(name)
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
      (!selectedUser || entry.authorId === selectedUser ||
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
  const groupName = (id: string | null) =>
    id ? data?.groups.find((group) => group.id === id)?.name ?? '연결된 조' : '활동 기록'
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
    if (updated.groupId) next.set('group', updated.groupId)
    else next.delete('group')
    next.set('day', updated.date)
    next.delete('view')
    navigate(
      `${routes.community.activityRecord(updated.id)}?${next.toString()}`,
      { replace: true }
    )
  }

  return (
    <PageFrame title="활동" className={`study-frame study-frame--${mode}`} bodyClassName={`study-page study-page--${mode}`}>
      {mode === 'new' ? (
        <>
          {data?.groupsError && <p className="study-error" role="alert">{data.groupsError}
            <button type="button" className="study-text-button" onClick={() => setReload((value) => value + 1)}>다시 불러오기</button>
          </p>}
          <RecordEditor data={{ groups: manageableGroups, records: [] }} initialGroup="all" onSave={save} back={back} />
        </>
      ) : error ? (
        <div className="study-empty">
          <p role="alert">{error}</p>
          {mode === 'list' && <Link className="study-primary" to={routes.community.activityRecordNew}>활동 등록</Link>}
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
      ) : mode === 'edit' ? (
        mode === 'edit' && !record ? (
          <div className="study-empty">
            <p>활동 기록을 찾을 수 없습니다.</p>
            <Link to={back}>목록으로 돌아가기</Link>
          </div>
        ) : !canEdit ? (
          <div className="study-empty">
            <p>이 활동을 수정할 권한이 없습니다.</p>
            <Link to={back}>목록으로 돌아가기</Link>
          </div>
        ) : (
          <>
          {data.groupsError && <p className="study-error" role="alert">{data.groupsError}</p>}
          <RecordEditor
            key={record?.id ?? 'new'}
            data={{ ...data, groups: manageableGroups }}
            record={record}
            initialGroup={selectedGroup}
            onSave={save}
            back={back}
          />
          </>
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
                {record.groupId ? <Link
                  className={`study-group study-group--${record.groupId}`}
                  to={routes.community.activityGroup(record.groupId)}
                >
                  {groupName(record.groupId)}
                </Link> : <span className="study-group">활동 기록</span>}
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
                  <>
                  <Link
                    className="study-text-button"
                    to={`${routes.community.activityRecordEditor(record.id)}${search}`}
                  >
                    <Icon name="edit" size={16} />
                    수정
                  </Link>
                  <button type="button" className="study-text-button" onClick={async () => {
                    if (!window.confirm('이 활동 기록을 삭제할까요?')) return
                    try { await deleteActivityRecord(record); navigate(back, { replace: true }) }
                    catch { window.alert('삭제하지 못했습니다. 권한 또는 최신 수정 내용을 확인해 주세요.') }
                  }}>삭제</button>
                  </>
                )}
              </div>
            </header>
            <div className={`study-detail-layout${record.attendance.length ? '' : ' study-detail-layout--standalone'}`}>
              <article className="study-body" data-color-mode="light">
                <ActivityPhotos photos={record.photos ?? []} />
                <MDEditor.Markdown source={rewriteMarkdownImageUrls(prepareMarkdownForDisplay(record.content), resolveApiAssetUrl)} skipHtml />
              </article>
              {record.attendance.length > 0 && <section
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
              </section>}
            </div>
          </>
        )
      ) : (
        <>
          <header className="study-page-heading">
            <h2>{view === 'attendance' ? '출석 체크' : '활동 기록'}</h2>
            {(
              <Link
                className="study-primary"
                to={`${routes.community.activityRecordNew}${search}`}
              >
                <Icon name="plus" size={18} />
                활동 등록
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
          {data.groupsError && <p className="study-error" role="alert">{data.groupsError}</p>}
          <ActivityControls groups={data.groups} start={start} end={end} selectedGroup={selectedGroup}
            layout={layout} view={view} onFilter={updateFilter} onToday={() => {
              const next = new URLSearchParams(params)
              next.set('week', mondayOf(activityToday()))
              next.set('day', activityToday())
              setParams(next)
            }} />
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
                  활동 등록
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
                    {entry.attendance.length > 0 && <div className="study-record-footer">
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
                    </div>}
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
            <div className="attendance-board">
              {records.map((entry) => <AttendanceSession key={entry.id} record={entry}
                groupName={groupName(entry.groupId)} onSave={async (value) => {
                  const updated = await saveActivityRecord(value, true)
                  setData((current) => current && ({ ...current,
                    records: current.records.map((item) => item.id === updated.id ? updated : item)
                  }))
                }} />)}
            </div>
          )}
        </>
      )}
    </PageFrame>
  )
}
