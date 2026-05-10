import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [activeServiceIndex, setActiveServiceIndex] = useState(0)

  useEffect(() => {
    servicesApi.getMemberServices()
      .then((items) => setServices(items.slice(0, 3)))
      .catch(() => setServices([]))
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

      <section className="surface-card panel portal-services-panel">
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
        ) : (
          <div className="portal-service-empty">
            등록된 유저 서비스가 없습니다.
          </div>
        )}
      </section>
    </section>
  )
}
