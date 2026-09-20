import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  isActivityPreview,
  activityLink,
  loadActivityGroups,
  createActivityGroup
} from '../activityRepository'
import { useAuth } from '../auth/AuthContext'
import { isAdminUser } from '../auth/adminAccess'
import type { StudyGroup } from '../activity'
import { routes } from '../routes'
import { Icon } from './Icon'
import './studyConnections.css'

export function StudyConnections({
  userId,
  recruitId,
  ownProfile = false,
  canManage = false
}: {
  userId?: string
  recruitId?: string
  ownProfile?: boolean
  canManage?: boolean
}) {
  const { isLoggedIn, user } = useAuth()
  const activityPreview = isActivityPreview()
  const [data, setData] = useState<StudyGroup[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  useEffect(() => {
    if (!activityPreview && !isLoggedIn) return
    let active = true
    loadActivityGroups()
      .then((value) => {
        if (active) setData(value)
      })
      .catch(() => {
        if (active) setError('활동을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isLoggedIn, activityPreview])
  if (!isLoggedIn && !activityPreview) return null
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
              ? '나의 모집과 활동'
              : '참여 활동'}
        </h3>
        {activityPreview && <small>미리보기</small>}
      </header>
      {ownProfile && (
        <nav aria-label="나의 모집">
          <Link to={`${routes.community.recruit}?view=applications`}>
            지원 내역
          </Link>
          <Link to={`${routes.community.recruit}?view=saved`}>관심 공고</Link>
          <Link to={`${routes.community.recruit}?view=manage`}>{isAdminUser(user) ? '모집 관리' : '내 공고'}</Link>
        </nav>
      )}
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">활동을 불러오는 중입니다.</p>}
      {groups.map((group) => (
        <div className="study-connection-row" key={group.id}>
          <Link to={activityLink(routes.community.activityGroup(group.id))}>
            <Icon name="calendar" size={16} />
            <span>{group.name}</span>
            <Icon name="chevron-right" size={16} />
          </Link>
          {!recruitId && group.recruitId && (
            <Link
              className="study-connection-source"
              to={activityLink(routes.community.recruitNotice(group.recruitId))}
            >
              모집 공고
            </Link>
          )}
        </div>
      ))}
      {userId ? (
        <Link
          className="study-connection-all"
          to={activityLink(routes.community.activityUser(userId))}
        >
          {ownProfile ? '내 활동과 출석' : '활동과 출석 보기'}
          <Icon name="chevron-right" size={16} />
        </Link>
      ) : (
        !loading && !groups.length && !error && <p>연결된 활동이 없습니다.</p>
      )}
      {recruitId &&
        canManage &&
        !activityPreview &&
        !loading &&
        !groups.length && (
          <form
            className="study-group-create"
            onSubmit={async (event) => {
              event.preventDefault()
              if (creating) return
              setCreating(true)
              setError('')
              try {
                const group = await createActivityGroup(recruitId, name.trim())
                setData((current) => [...current, group])
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
            <button type="submit" disabled={creating}>
              {creating ? '연결 중...' : '활동 시작'}
            </button>
            <p>공고 작성자와 승인된 지원자가 조원으로 연결됩니다.</p>
          </form>
        )}
    </section>
  )
}
