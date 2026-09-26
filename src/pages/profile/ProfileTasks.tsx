import { Link } from 'react-router-dom'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import type { ProfileOverview } from './profileOverview'

const count = (value: number | null | undefined) => value == null ? '-' : value.toLocaleString()

export function ProfileTasks({ userId, ownProfile, overview }: {
  userId: string
  ownProfile: boolean
  overview?: ProfileOverview
}) {
  const counts = overview?.counts
  const privateCounts = ownProfile && overview?.isSelf ? counts : undefined
  return <section className="profile-tasks" aria-label={ownProfile ? '내 활동 바로가기' : '활동 바로가기'}>
    <div className="profile-task profile-task--study">
      <Link className="profile-task-primary" to={routes.community.activityUser(userId)}>
        <Icon name="calendar" size={18} /><span>활동 · 출석</span>{' '}<strong>{count(counts?.studyRecords)}</strong>
      </Link>
      <div className="profile-task-links">
        <span>참여 스터디 {count(counts?.studyGroups)}</span>
        {ownProfile && <Link to={routes.community.activityRecordNew}>출석 체크<Icon name="plus" size={13} /></Link>}
      </div>
    </div>
    <div className="profile-task profile-task--recruit">
      <Link className="profile-task-primary" to={`${routes.community.recruit}${ownProfile ? '?view=applications' : ''}`}>
        <Icon name="users" size={18} /><span>{ownProfile ? '모집 지원' : '모집 공고'}</span>{' '}
        <strong>{count(ownProfile ? privateCounts?.recruitApplications : counts?.recruits)}</strong>
      </Link>
      <div className="profile-task-links">
        {ownProfile ? <>
          <Link to={`${routes.community.recruit}?view=saved`}>관심 {count(privateCounts?.savedRecruits)}</Link>
          <Link to={`${routes.community.recruit}?view=manage`}>내 공고 {count(counts?.recruits)}</Link>
        </> : <Link to={routes.community.recruit}>모집 둘러보기<Icon name="chevron-right" size={13} /></Link>}
      </div>
    </div>
    <div className="profile-task profile-task--community">
      <Link className="profile-task-primary" to={`${routes.users.detail(userId)}?tab=posts`}>
        <Icon name="message" size={18} /><span>작성 글</span>{' '}
        <strong>{count(counts ? counts.authoredPosts + counts.infoArticles + counts.recruits : undefined)}</strong>
      </Link>
      <div className="profile-task-links">
        <Link to={routes.community.board}>게시판</Link><Link to={routes.community.info}>정보공유</Link><Link to={routes.community.qna}>Q&amp;A</Link>
      </div>
    </div>
    <div className="profile-task profile-task--service">
      <Link className="profile-task-primary" to={`${routes.users.detail(userId)}?tab=services`}>
        <Icon name="network" size={18} /><span>등록 서비스</span>{' '}<strong>{count(counts?.services)}</strong>
      </Link>
      <div className="profile-task-links">
        <Link to={routes.services.officialInstance}>인스턴스{ownProfile ? ` ${count(privateCounts?.instanceApplications)}` : ''}</Link>
        <Link to={routes.services.officialDomain}>도메인{ownProfile ? ` ${count(privateCounts?.domainApplications)}` : ''}</Link>
      </div>
    </div>
  </section>
}
