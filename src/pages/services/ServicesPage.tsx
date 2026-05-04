import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { ServicePage } from '../service/ServicePage'

type ServiceCategory = 'productivity' | 'ai' | 'community' | 'learning'
type ServicesTab = 'cossp' | 'official' | 'unofficial'

type MemberService = {
  id: string
  title: string
  category: ServiceCategory
  owner: string
  summary: string
  url: string
  githubUrl: string
  imageUrl: string
  tags: string[]
  status: '운영 중' | '베타' | '준비 중'
}

const categories: { id: ServiceCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'productivity', label: '생산성' },
  { id: 'ai', label: 'AI' },
  { id: 'community', label: '커뮤니티' },
  { id: 'learning', label: '학습' },
]

const memberServices: MemberService[] = [
  {
    id: 'paper-scout',
    title: 'Paper Scout',
    category: 'ai',
    owner: '최민호',
    summary: '관심 키워드로 논문을 모으고 요약하는 리서치 도구입니다.',
    url: 'paper-scout.coala.dev',
    githubUrl: 'https://github.com/JBNU-COALA/paper-scout',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
    tags: ['LLM', '논문', '요약'],
    status: '베타',
  },
  {
    id: 'study-mate',
    title: 'Study Mate',
    category: 'learning',
    owner: '이도윤',
    summary: '스터디 일정, 과제, 출석을 한 번에 관리하는 서비스입니다.',
    url: 'study-mate.coala.dev',
    githubUrl: 'https://github.com/JBNU-COALA/study-mate',
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
    tags: ['스터디', '일정', '과제'],
    status: '운영 중',
  },
  {
    id: 'deploy-note',
    title: 'Deploy Note',
    category: 'productivity',
    owner: '박세연',
    summary: '팀 배포 체크리스트와 릴리즈 노트',
    url: 'deploy-note.coala.dev',
    githubUrl: 'https://github.com/JBNU-COALA/deploy-note',
    imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80',
    tags: ['배포', '문서', '팀'],
    status: '운영 중',
  },
]

export function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialParam = searchParams.get('tab')
  const initialTab: ServicesTab =
    initialParam === 'official' ? 'official' : initialParam === 'unofficial' ? 'unofficial' : 'cossp'
  const [activeTab, setActiveTab] = useState<ServicesTab>(initialTab)
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all')
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'official' || tab === 'unofficial' || tab === 'cossp') {
      setActiveTab(tab)
      return
    }

    setActiveTab('cossp')
    if (tab) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const visibleServices = useMemo(() => {
    return memberServices.filter((service) => {
      if (activeCategory !== 'all' && service.category !== activeCategory) return false
      if (!normalizedQuery) return true

      return `${service.title} ${service.owner} ${service.summary} ${service.tags.join(' ')}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [activeCategory, normalizedQuery])

  return (
    <section className="coala-content coala-content--services">
      <div className="member-services">
        <header className="member-services-hero">
          <div>
            <h2>서비스</h2>
          </div>
        </header>

        {activeTab === 'cossp' ? (
          <section className="surface-card cossp-panel">
            <div className="cossp-visual" role="img" aria-label="Coala Open Source Project typography">
              <span>Coala</span>
              <span>Open Source</span>
              <span>Project</span>
            </div>
            <div className="cossp-copy">
              <p className="services-hub-eyebrow">COSSP</p>
              <h3>코알라 오픈소스 프로젝트</h3>
              <div className="cossp-feature-grid">
                <span>도메인 배포</span>
                <span>GitHub 협업</span>
                <span>서비스 운영 기록</span>
                <span>오픈소스 기여</span>
              </div>
            </div>
          </section>
        ) : activeTab === 'official' ? (
          <div className="official-service-panel">
            <div className="service-menu-tabs surface-card" aria-label="공식 서비스 메뉴">
              <button type="button" className="service-menu-tab is-active">
                <Icon name="network" size={22} />
                <span>인스턴스 대여</span>
              </button>
            </div>
            <ServicePage embedded />
          </div>
        ) : (
          <>
            <div className="member-services-toolbar surface-card">
              <div className="community-section-tabs member-services-tabs">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={
                      activeCategory === category.id
                        ? 'community-section-tab is-active'
                        : 'community-section-tab'
                    }
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <label className="resource-search-bar">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="서비스명, 만든 사람, 태그 검색"
                />
              </label>
            </div>

            <ul className="member-service-grid">
              {visibleServices.map((service) => (
                <li key={service.id} className="surface-card member-service-card member-service-card--with-media">
                  <div className="member-service-media" style={{ backgroundImage: `url(${service.imageUrl})` }} />
                  <div className="member-service-card-head">
                    <span className="member-service-status">{service.status}</span>
                    <Icon name="link" size={15} />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.summary}</p>
                  <div className="member-service-tags">
                    {service.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <footer>
                    <span>{service.owner}</span>
                    <strong>{service.url}</strong>
                  </footer>
                </li>
              ))}
            </ul>

            <section className="surface-card member-service-form">
              <h3>비공식 서비스 추가</h3>
              <div className="member-service-form-grid">
                <label className="jcloud-field">
                  <span className="jcloud-label">서비스명</span>
                  <input className="jcloud-input" placeholder="서비스 이름" />
                </label>
                <label className="jcloud-field">
                  <span className="jcloud-label">URL</span>
                  <input className="jcloud-input" placeholder="https:// 또는 도메인" />
                </label>
                <label className="jcloud-field">
                  <span className="jcloud-label">GitHub 링크</span>
                  <input className="jcloud-input" placeholder="https://github.com/..." />
                </label>
                <label className="jcloud-field">
                  <span className="jcloud-label">태그</span>
                  <input className="jcloud-input" placeholder="AI, 생산성, 스터디" />
                </label>
                <label className="jcloud-field member-service-form-wide">
                  <span className="jcloud-label">이미지</span>
                  <input className="jcloud-input" placeholder="대표 이미지 URL" />
                </label>
                <label className="jcloud-field member-service-form-wide">
                  <span className="jcloud-label">소개</span>
                  <textarea className="jcloud-textarea" rows={5} placeholder="서비스가 해결하는 문제와 주요 기능을 적어주세요." />
                </label>
              </div>
              <div className="recruit-write-footer">
                <button type="button" className="jcloud-submit-button">서비스 추가하기</button>
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  )
}
