import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recruitsApi, type RecruitItem, type RecruitStatus } from '../../shared/api/recruits'
import { servicesApi, type MemberService } from '../../shared/api/services'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { PageHero } from '../../shared/ui/PageHero'
import { SafeImage } from '../../shared/ui/SafeImage'
import { PostCard } from './PostCard'
import { ResourcesCard } from './ResourcesCard'
import { recruitItems } from '../../dummy/recruitData'

type HomePageProps = {
  onOpenAllPosts?: () => void
  onOpenInfo?: () => void
  onOpenPost?: (boardId: number, postId: number) => void
  onOpenInfoArticle?: (boardId: number, infoId: number) => void
}

export function HomePage({ onOpenAllPosts, onOpenInfo, onOpenPost, onOpenInfoArticle }: HomePageProps) {
  const navigate = useNavigate()
  const [services, setServices] = useState<MemberService[]>([])
  const [recruits, setRecruits] = useState<RecruitItem[]>([])

  useEffect(() => {
    servicesApi.getMemberServices()
      .then((items) => setServices(items.slice(0, 3)))
      .catch(() => setServices([]))

    recruitsApi.getRecruits({ status: 'all', sort: 'latest' })
      .then((items) => setRecruits((items.length > 0 ? items : recruitItems).slice(0, 2)))
      .catch(() => setRecruits(recruitItems.slice(0, 2)))
  }, [])

  const openService = (serviceId: string) => {
    navigate(routes.services.userDetail(serviceId))
  }
  const openRecruit = (recruitId: string) => {
    navigate(routes.community.recruitNotice(recruitId))
  }
  const getRecruitStatusLabel = (status: RecruitStatus) => {
    if (status === 'open') return '모집중'
    if (status === 'closing-soon') return '마감 임박'
    return '마감'
  }

  return (
    <section className="coala-content coala-content--portal">
      <PageHero
        title="COALA Developer Club"
        eyebrow="TOGETHER WE BUILD"
        description="함께 만들고 운영하는 개발 동아리"
        tone="home"
        size="large"
        headingLevel="h1"
        action={(
          <button type="button" className="page-hero-button" onClick={() => navigate(routes.about)}>
            동아리 소개
            <Icon name="chevron-right" size={15} />
          </button>
        )}
      />

      <div className="portal-grid portal-grid--dashboard">
        <ResourcesCard onOpenInfo={onOpenInfo} onOpenInfoArticle={onOpenInfoArticle} dashboard />
        <PostCard onOpenAllPosts={onOpenAllPosts} onOpenPost={onOpenPost} limit={8} dashboard />
      </div>

      <div className="portal-home-bottom">
        <section className="surface-card panel portal-services-panel portal-services-panel--home">
          <header className="panel-header">
            <div>
              <p className="portal-section-eyebrow">User Services</p>
              <h2 className="panel-title">유저 서비스</h2>
            </div>
            <button type="button" className="panel-action panel-action--solid" onClick={() => navigate(routes.services.user)}>
              서비스 보기
            </button>
          </header>

          {services.length > 0 ? (
            <div className="portal-service-showcase-grid" aria-label="유저 서비스 목록">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className="portal-service-showcase-card"
                  onClick={() => openService(service.id)}
                  aria-label={`${service.title} 서비스 안내 열기`}
                >
                  <span className="portal-service-showcase-image">
                    <SafeImage
                      src={service.imageUrl || '/coala-card-placeholder.png'}
                      alt=""
                      loading="lazy"
                      fallback={<img src="/coala-card-placeholder.png" alt="" loading="lazy" />}
                    />
                  </span>
                  <span className="portal-service-showcase-copy">
                    <span className="portal-service-status">{service.status}</span>
                    <strong>{service.title}</strong>
                    <span>{service.summary}</span>
                    <small>{service.owner}</small>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </button>
              ))}
            </div>
          ) : (
            <div className="portal-service-empty">
              등록된 유저 서비스가 없습니다.
            </div>
          )}
        </section>

        <section className="surface-card panel portal-recruit-panel">
          <header className="panel-header">
            <div>
              <p className="portal-section-eyebrow">Recruit</p>
              <h2 className="panel-title">모집</h2>
            </div>
            <button type="button" className="panel-action" onClick={() => navigate(routes.community.recruit)}>
              모집 보기
            </button>
          </header>

          {recruits.length > 0 ? (
            <ul className="portal-recruit-list" aria-label="최근 모집 공고">
              {recruits.map((recruit) => (
                <li key={recruit.id}>
                  <button
                    type="button"
                    className="portal-recruit-item"
                    onClick={() => openRecruit(recruit.id)}
                    aria-label={`${recruit.title} 모집 공고 열기`}
                  >
                    <span className={`portal-recruit-status portal-recruit-status--${recruit.status}`}>
                      {getRecruitStatusLabel(recruit.status)}
                    </span>
                    <span className="portal-recruit-copy">
                      <strong>{recruit.title}</strong>
                      <span>{recruit.shortDesc}</span>
                      <small>
                        {recruit.authorName || recruit.host} · {recruit.currentMembers}/{recruit.maxMembers}명 · {recruit.expectedDuration}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="portal-service-empty">
              등록된 모집 공고가 없습니다.
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
