import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  loadActivityGroups,
  createActivityGroup
} from '../activityRepository'
import { useAuth } from '../auth/AuthContext'
import type { StudyGroup } from '../activity'
import { routes } from '../routes'
import { Icon } from './Icon'
import './studyConnections.css'

type StudyConnectionsProps = {
  userId?: string
  recruitId?: string
  ownProfile?: boolean
  canManage?: boolean
}

export function StudyConnections(props: StudyConnectionsProps) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn) return null
  return <StudyConnectionsContent key={`${user?.id}:${props.userId ?? ''}:${props.recruitId ?? ''}`} {...props} />
}

function StudyConnectionsContent({
  userId,
  recruitId,
  ownProfile = false,
  canManage = false
}: StudyConnectionsProps) {
  const [data, setData] = useState<StudyGroup[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    loadActivityGroups(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('활동을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [revision])
  const groups = data.filter((group) =>
    recruitId
      ? group.recruitId === recruitId
      : group.members.some((member) => member.userId === userId)
  )
  return (
    <section className="study-connections" aria-label="모집과 활동">
      <header>
        <h3>
          {recruitId
            ? '조별 활동'
            : ownProfile
              ? '참여 중인 스터디'
              : '참여 활동'}
        </h3>
        {!loading && !error && <small>{groups.length}개</small>}
      </header>
      {error && <div className="study-connection-error"><p role="alert">{error}</p>
        <button type="button" onClick={() => { setError(''); setLoading(true); setRevision((value) => value + 1) }}>다시 불러오기</button>
      </div>}
      {loading && <p role="status">활동을 불러오는 중입니다.</p>}
      {groups.map((group) => (
        <div className="study-connection-row" key={group.id}>
          <Link to={routes.community.activityGroup(group.id)}>
            <Icon name="calendar" size={16} />
            <span>{group.name}</span>
            <small>{group.members.length}명</small>
            <Icon name="chevron-right" size={16} />
          </Link>
          {group.canManage && <Link className="study-connection-source"
            to={`${routes.community.activityRecordNew}?group=${encodeURIComponent(group.id)}`}>
            <Icon name="plus" size={14} />출석 체크
          </Link>}
          {!recruitId && group.recruitId && (
            <Link
              className="study-connection-source"
              to={routes.community.recruitNotice(group.recruitId)}
            >
              모집 공고
            </Link>
          )}
        </div>
      ))}
      {!loading && !groups.length && !error && <p>연결된 활동이 없습니다.</p>}
      {userId && (
        <Link
          className="study-connection-all"
          to={routes.community.activityUser(userId)}
        >
          {ownProfile ? '내 활동과 출석' : '활동과 출석 보기'}
          <Icon name="chevron-right" size={16} />
        </Link>
      )}
      {recruitId &&
        canManage &&
        !loading &&
        !error &&
        !groups.length && (
          <form
            className="study-group-create"
            onSubmit={async (event) => {
              event.preventDefault()
              if (creating || !name.trim()) return
              setCreating(true)
              setError('')
              try {
                const group = await createActivityGroup(recruitId, name.trim())
                setData((current) => [...current, group])
                setName('')
              } catch {
                setError(
                  '조를 만들지 못했습니다. 권한과 연결 상태를 확인해 주세요.'
                )
              } finally {
                setCreating(false)
              }
            }}
          >
            <label>
              활동 조 이름
              <input
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 프론트엔드 1조"
              />
            </label>
            <button type="submit" disabled={creating || !name.trim()}>
              {creating ? '연결 중...' : '활동 시작'}
            </button>
            <p>공고 작성자와 승인된 지원자가 조원으로 연결됩니다.</p>
          </form>
        )}
    </section>
  )
}
