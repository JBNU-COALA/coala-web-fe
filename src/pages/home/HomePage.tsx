import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recruitsApi, type RecruitItem, type RecruitStatus } from '../../shared/api/recruits'
import { servicesApi, type MemberService } from '../../shared/api/services'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { PostCard } from './PostCard'
import { ResourcesCard } from './ResourcesCard'

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
  const [activeServiceIndex, setActiveServiceIndex] = useState(0)

  useEffect(() => {
    servicesApi.getMemberServices()
      .then((items) => setServices(items.slice(0, 3)))
      .catch(() => setServices([]))

    recruitsApi.getRecruits({ status: 'all', sort: 'latest' })
      .then((items) => setRecruits(items.slice(0, 4)))
      .catch(() => setRecruits([]))
  }, [])

  useEffect(() => {
    if (services.length <= 1) return

    const timer = window.setInterval(() => {
      setActiveServiceIndex((index) => (index + 1) % services.length)
    }, 4200)

    return () => window.clearInterval(timer)
  }, [services.length])

  const activeService = services.length > 0 ? services[activeServiceIndex % services.length] : null
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
      <section className="portal-hero portal-hero--slider" aria-label="홈 배너">
        <article className="portal-slide is-active">
          <div className="portal-slide-overlay" />
          <div className="portal-hero-copy">
            <h1 className="portal-hero-title">준비중입니다</h1>
          </div>
        </article>
      </section>

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

          {activeService ? (
            <>
              <div className="portal-service-slider">
                <button
                  type="button"
                  className="portal-service-feature"
                  onClick={() => openService(activeService.id)}
                  aria-label={`${activeService.title} 서비스 안내 열기`}
                >
                  {activeService.imageUrl ? (
                    <span
                      className="portal-service-feature-image"
                      style={{ backgroundImage: `url(${activeService.imageUrl})` }}
                    />
                  ) : (
                    <span className="portal-service-feature-image portal-service-feature-image--empty">
                      <Icon name="image" size={28} />
                    </span>
                  )}
                  <span className="portal-service-feature-shade" />
                  <span className="portal-service-feature-copy">
                    <span className="portal-service-status">{activeService.status}</span>
                    <strong>{activeService.title}</strong>
                    <span>{activeService.summary}</span>
                  </span>
                </button>

                <div className="portal-service-rail" aria-label="유저 서비스 목록">
                  {services.map((service, index) => (
                    <button
                      key={service.id}
                      type="button"
                      className={index === activeServiceIndex ? 'portal-service-thumb is-active' : 'portal-service-thumb'}
                      onClick={() => setActiveServiceIndex(index)}
                    >
                      {service.imageUrl ? (
                        <span
                          className="portal-service-thumb-image"
                          style={{ backgroundImage: `url(${service.imageUrl})` }}
                        />
                      ) : (
                        <span className="portal-service-thumb-image portal-service-thumb-image--empty">
                          <Icon name="image" size={16} />
                        </span>
                      )}
                      <span className="portal-service-thumb-copy">
                        <strong>{service.title}</strong>
                        <small>{service.owner}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <ul className="portal-service-mobile-list" aria-label="유저 서비스 목록">
                {services.map((service) => (
                  <li key={service.id}>
                    <button
                      type="button"
                      className="portal-service-mobile-item"
                      onClick={() => openService(service.id)}
                      aria-label={`${service.title} 서비스 안내 열기`}
                    >
                      {service.imageUrl ? (
                        <span
                          className="portal-service-mobile-media"
                          style={{ backgroundImage: `url(${service.imageUrl})` }}
                        />
                      ) : (
                        <span className="portal-service-mobile-media portal-service-mobile-media--empty">
                          <Icon name="image" size={18} />
                        </span>
                      )}
                      <span className="portal-service-mobile-copy">
                        <span className="portal-service-status">{service.status}</span>
                        <strong>{service.title}</strong>
                        <span>{service.summary}</span>
                        <small>{service.owner}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
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
