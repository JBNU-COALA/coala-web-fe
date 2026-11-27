import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { Icon } from '../../shared/ui/Icon'
import { TechLogo } from '../../shared/ui/TechLogo'
import { ServiceGallery } from './ServiceGallery'
import type { MemberService } from './ServicesPage'

const categoryNames: Record<string, string> = { productivity: '생산성', ai: 'AI', community: '커뮤니티', learning: '교육' }
const externalUrl = (url: string) => /^https?:\/\//i.test(url) ? url : `https://${url}`

export function ServiceProjectDetail({ service, error, retiring, onEdit, onRetire }: {
  service: MemberService; error: string | null; retiring: boolean;
  onEdit: () => void; onRetire: () => void;
}) {
  const technologies = service.stack ?? []
  return <article className="service-project-detail">
    <main className="service-project-content">
      <ServiceGallery key={service.id} title={service.title} images={[service.imageUrl, ...(service.additionalImageUrls ?? [])]} />
      <section className="service-project-prose">
        <h2>서비스 소개 및 문제 정의</h2>
        <p>{service.description?.trim() || service.summary}</p>
      </section>
      {!!service.features?.length && <section className="service-project-prose">
        <h2>핵심 기능 및 해결 방식</h2>
        <ul>{service.features.map((feature, index) => <li key={index}>{feature}</li>)}</ul>
      </section>}
      <section className="service-project-prose">
        <h2>카테고리</h2>
        <div className="service-project-tags"><span>{categoryNames[service.category] ?? service.category}</span>{service.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </section>
      <section className="service-project-prose">
        <h2>기술 스택</h2>
        {technologies.length ? <div className="service-project-tags">{technologies.map((name) => <span key={name}><TechLogo name={name} />{name}</span>)}</div> : <p className="service-project-muted">등록된 기술 스택이 없습니다.</p>}
      </section>
    </main>
    <aside className="service-project-sidebar" aria-label="프로젝트 정보">
      <span className="service-project-status">{service.status}</span>
      <h1>{service.title}</h1>
      <p className="service-project-summary">{service.summary}</p>
      {service.period && <p className="service-project-period">{service.period}</p>}
      <section className="service-project-maker">
        <h2>만든 사람</h2>
        <div><CharacterAvatar name={service.owner} size="xs" /><span>{service.owner}</span></div>
      </section>
      {service.audience && <section className="service-project-audience"><h2>이용 대상</h2><p>{service.audience}</p></section>}
      <div className="service-project-links">
        <a href={externalUrl(service.url)} target="_blank" rel="noreferrer"><Icon name="globe-color" size={15} />서비스 방문<Icon name="chevron-right" size={13} /></a>
        {service.githubUrl && <a href={externalUrl(service.githubUrl)} target="_blank" rel="noreferrer"><Icon name="github" size={15} />GitHub<Icon name="chevron-right" size={13} /></a>}
      </div>
      {service.canEdit && <div className="service-project-manage">
        <button type="button" onClick={onEdit}><Icon name="pencil-color" size={14} />수정</button>
        <button type="button" disabled={retiring} onClick={onRetire}>운영 중지</button>
      </div>}
      {error && <p role="alert">{error}</p>}
    </aside>
  </article>
}
