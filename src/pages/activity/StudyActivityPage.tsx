import { ActivityPhotos } from './ActivityPhotos'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { Icon } from '../../shared/ui/Icon'
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
  saveActivityRecord
} from '../../shared/activityRepository'
import { RequireAuth } from '../../shared/auth/RequireAuth'
import { AttendanceList, AttendanceSummary } from './AttendanceList'
import { ActivityCalendar } from './ActivityCalendar'
import { RecordEditor } from './RecordEditor'
import { prepareMarkdownForDisplay, rewriteMarkdownImageUrls } from '../../shared/markdown'
import { resolveApiAssetUrl } from '../../shared/api/client'
import './activity.css'
import { PageFrame } from '../../shared/ui/PageFrame'
import { ActivityControls } from './ActivityControls'
import { AttendanceCard } from './AttendanceCard'
import { ActivityRecordActions } from './ActivityRecordActions'

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
              : '출석 기록을 불러오지 못했습니다.'
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
  const layout = params.get('layout') === 'calendar' ? 'calendar' : 'card'
  const selectedDate = parseDate(params.get('day') ?? '')
    ? params.get('day')!
    : params.has('week') ? start : activityToday()
  const selectedUser = params.get('user')
  const canonicalParams = new URLSearchParams(params)
  canonicalParams.delete('view')
  const search = canonicalParams.size ? `?${canonicalParams.toString()}` : ''
  const back = `${root}${search}`
  const updateFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params)
    next.delete('view')
    if (value === 'all') next.delete(name)
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
      layout === 'calendar'
        ? entry.date === selectedDate
        : entry.date >= start && entry.date <= end
    )
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        right.updatedAt.localeCompare(left.updatedAt)
    )
  const groupName = (id: string | null) =>
    id ? data?.groups.find((group) => group.id === id)?.name ?? '연결된 조' : '출석 기록'
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
          {mode === 'list' && <Link className="study-primary" to={routes.community.activityRecordNew}>출석 체크</Link>}
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
          출석 기록을 불러오는 중입니다.
        </p>
      ) : mode === 'edit' ? (
        mode === 'edit' && !record ? (
          <div className="study-empty">
            <p>출석 기록을 찾을 수 없습니다.</p>
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
            <p>출석 기록을 찾을 수 없습니다.</p>
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
                </Link> : <span className="study-group">출석 기록</span>}
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
                {canEdit && <ActivityRecordActions record={record} search={search} back={back} />}
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
            <h2>출석 체크</h2>
            {(
              <Link
                className="study-primary"
                to={`${routes.community.activityRecordNew}${search}`}
              >
                <Icon name="plus" size={18} />
                출석 체크
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
            layout={layout} onFilter={updateFilter} onToday={() => {
              const next = new URLSearchParams(params)
              next.delete('view')
              next.set('week', mondayOf(activityToday()))
              next.set('day', activityToday())
              setParams(next)
            }} />
          {layout === 'calendar' && (
            <>
              <ActivityCalendar
                date={selectedDate}
                records={filteredRecords}
                onSelect={(day) => {
                  const next = new URLSearchParams(params)
                  next.delete('view')
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
              <h2>선택한 기간에 출석 기록이 없습니다.</h2>
              <p>다른 날짜의 기록을 확인해 보세요.</p>
              {manageableGroups.length > 0 && (
                <Link
                  className="study-text-button"
                  to={`${routes.community.activityRecordNew}${search}`}
                >
                  출석 체크
                  <Icon name="chevron-right" size={16} />
                </Link>
              )}
            </div>
          ) : (
            <ol className="study-feed study-feed--card">
              {records.map((entry) => <AttendanceCard key={entry.id} record={entry}
                groupName={groupName(entry.groupId)} search={search}
                recruitId={data.groups.find((group) => group.id === entry.groupId)?.recruitId} />)}
            </ol>
          )}
        </>
      )}
    </PageFrame>
  )
}
