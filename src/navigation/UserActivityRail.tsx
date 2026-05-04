import { useEffect, useMemo, useState } from 'react'
import { activityMembers } from '../dummy/leaderboardData'
import { boardsApi } from '../shared/api/boards'
import { postsApi } from '../shared/api/posts'
import { useAuth } from '../shared/auth/AuthContext'
import { Icon, type IconName } from '../shared/ui/Icon'
import type { AppRoute } from './navigationData'

type RailRoute = Extract<AppRoute, 'community' | 'recruit' | 'game' | 'service'>

type UserActivityRailProps = {
  route: RailRoute
  onPrimaryAction: () => void
  onOpenProfile: () => void
  onLogin: () => void
}

type RailMetric = {
  label: string
  value: string
  tone?: 'green' | 'slate' | 'amber'
}

type RailSignal = {
  label: string
  detail?: string
  icon: IconName
}

const routeMeta: Record<RailRoute, { eyebrow: string; title: string; primaryLabel: string; primaryIcon: IconName }> = {
  community: {
    eyebrow: 'Community',
    title: '내 커뮤니티',
    primaryLabel: '글쓰기',
    primaryIcon: 'edit',
  },
  service: {
    eyebrow: 'Instance',
    title: '내 인스턴스 대여',
    primaryLabel: '인스턴스 대여',
    primaryIcon: 'network',
  },
  recruit: {
    eyebrow: 'Recruit',
    title: '내 모집 진행',
    primaryLabel: '모집 보기',
    primaryIcon: 'users',
  },
  game: {
    eyebrow: 'Members',
    title: '내 프로필',
    primaryLabel: '유저 목록',
    primaryIcon: 'users',
  },
}

export function UserActivityRail({
  route,
  onPrimaryAction,
  onOpenProfile,
  onLogin,
}: UserActivityRailProps) {
  const { user, isLoggedIn } = useAuth()
  const [myPostCount, setMyPostCount] = useState(0)
  const [myRecentPost, setMyRecentPost] = useState<string | null>(null)

  const me = activityMembers.find((member) => member.isMe) ?? activityMembers[activityMembers.length - 1]
  const displayName = user?.name ?? user?.email ?? '게스트'
  const displayRole = user?.department ?? '게스트'
  const initial = displayName.charAt(0)
  const meta = routeMeta[route]

  useEffect(() => {
    if (!user) {
      return
    }

    const fetchMyPosts = async () => {
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((board) => postsApi.getPosts(board.boardId)))
        const mine = postsArrays
          .flat()
          .filter((post) => post.userId === user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setMyPostCount(mine.length)
        setMyRecentPost(mine[0]?.title ?? null)
      } catch {
        setMyPostCount(0)
        setMyRecentPost(null)
      }
    }

    fetchMyPosts()
  }, [user])

  const metrics = useMemo<RailMetric[]>(() => {
    if (!isLoggedIn) {
      return [
        { label: '로그인 상태', value: '필요', tone: 'amber' },
        { label: '프로필 정보', value: '로그인 필요', tone: 'slate' },
      ]
    }

    if (route === 'community') {
      return [
        { label: '작성 게시글', value: `${myPostCount}개`, tone: 'green' },
        { label: '최근 글', value: myRecentPost ? '있음' : '없음', tone: 'slate' },
      ]
    }

    if (route === 'service') {
      return [
        { label: '대여 상태', value: '신청 가능', tone: 'green' },
        { label: '처리 흐름', value: '신청/내역', tone: 'slate' },
      ]
    }

    if (route === 'recruit') {
      return [
        { label: '지원 상태', value: '확인 필요', tone: 'amber' },
        { label: '관심 모집', value: '진행 중', tone: 'green' },
      ]
    }

    return [
      { label: '역할', value: me.role, tone: 'green' },
      { label: '학년', value: me.grade, tone: 'slate' },
      { label: '연구실', value: me.lab, tone: 'slate' },
    ]
  }, [isLoggedIn, me.grade, me.lab, me.role, myPostCount, myRecentPost, route])

  const signals = useMemo<RailSignal[]>(() => {
    if (route === 'community') {
      return [
        {
          label: '최근 작성',
          detail: isLoggedIn
            ? myRecentPost ?? undefined
            : undefined,
          icon: 'file',
        },
        {
          label: '글쓰기',
          icon: 'edit',
        },
      ]
    }

    if (route === 'service') {
      return [
        {
          label: '인스턴스 대여',
          icon: 'network',
        },
        {
          label: '신청 내역',
          icon: 'book',
        },
      ]
    }

    if (route === 'recruit') {
      return [
        {
          label: '진행 중인 모집',
          icon: 'calendar',
        },
        {
          label: '내 참여',
          icon: 'users',
        },
      ]
    }

    return [
      {
        label: '유저 목록',
        icon: 'users',
      },
      {
        label: '내 계정',
        detail: `@${me.githubHandle}`,
        icon: 'user',
      },
    ]
  }, [isLoggedIn, me.githubHandle, myRecentPost, route])

  return (
    <aside className="user-activity-rail" aria-label="내 정보 요약">
      <section className="surface-card activity-rail-card activity-rail-profile">
        <div className="activity-rail-profile-head">
          <span className="activity-rail-avatar">{initial}</span>
          <div className="activity-rail-identity">
            <h2>{displayName}</h2>
            <p>{displayRole}</p>
          </div>
        </div>

        <p className="activity-rail-role">{meta.title}</p>

        <div className="activity-rail-actions">
          <button type="button" className="activity-rail-primary" onClick={onPrimaryAction}>
            <Icon name={meta.primaryIcon} size={14} />
            <span>{meta.primaryLabel}</span>
          </button>
          <button
            type="button"
            className="activity-rail-secondary"
            onClick={isLoggedIn ? onOpenProfile : onLogin}
          >
            {isLoggedIn ? '프로필' : '로그인'}
          </button>
        </div>
      </section>

      <section className="surface-card activity-rail-card">
        <h3 className="activity-rail-section-title">현재 상태</h3>
        <div className="activity-rail-metrics">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`activity-rail-metric activity-rail-metric--${metric.tone ?? 'slate'}`}
            >
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card activity-rail-card">
        <h3 className="activity-rail-section-title">이어볼 항목</h3>
        <ul className="activity-rail-signal-list">
          {signals.map((signal) => (
            <li key={signal.label} className="activity-rail-signal">
              <span className="activity-rail-signal-icon">
                <Icon name={signal.icon} size={14} />
              </span>
              <span>
                <strong>{signal.label}</strong>
                {signal.detail ? <small>{signal.detail}</small> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
