import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { ServicePage } from '../service/ServicePage'

type ServiceCategory = 'productivity' | 'ai' | 'community' | 'learning'
type ServicesTab = 'official' | 'unofficial'

type MemberService = {
  id: string
  title: string
  category: ServiceCategory
  owner: string
  summary: string
  url: string
  tags: string[]
  status: '운영 중' | '베타' | '준비 중'
}

const tabs: { id: ServicesTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'official', label: '공식 서비스', icon: 'network' },
  { id: 'unofficial', label: '비공식 서비스', icon: 'link' },
]

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
    tags: ['스터디', '일정', '과제'],
    status: '운영 중',
  },
  {
    id: 'deploy-note',
    title: 'Deploy Note',
    category: 'productivity',
    owner: '박세연',
    summary: '배포 체크리스트와 릴리즈 노트를 팀 단위로 관리합니다.',
    url: 'deploy-note.coala.dev',
    tags: ['배포', '문서', '팀'],
    status: '운영 중',
  },
]

export function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialParam = searchParams.get('tab')
  const initialTab: ServicesTab = initialParam === 'unofficial' ? 'unofficial' : 'official'
  const [activeTab, setActiveTab] = useState<ServicesTab>(initialTab)
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all')
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'unofficial') {
      setActiveTab('unofficial')
      return
    }

    setActiveTab('official')
    if (tab) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const changeTab = (nextTab: ServicesTab) => {
    setActiveTab(nextTab)
    setSearchParams(nextTab === 'official' ? {} : { tab: nextTab })
  }

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
            <p>공식 서비스는 동아리 오피셜, 비공식 서비스는 부원들이 올린 서비스입니다.</p>
          </div>
        </header>

        <div className="community-section-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'community-section-tab is-active' : 'community-section-tab'}
              onClick={() => changeTab(tab.id)}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'official' ? (
          <div className="official-service-panel">
            <section className="surface-card official-service-card official-service-card--single">
              <span className="official-service-icon">
                <Icon name="network" size={22} />
              </span>
              <span className="member-service-status">공식</span>
              <h3>인스턴스 신청</h3>
              <p>동아리 프로젝트와 실습에 필요한 서버 환경을 신청하고 관리합니다.</p>
              <div className="member-service-tags">
                <span>신청하기</span>
                <span>신청 내역</span>
                <span>문의사항</span>
              </div>
            </section>
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
                <li key={service.id} className="surface-card member-service-card">
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
              <h3>비공식 서비스 등록</h3>
              <div className="member-service-form-grid">
                <label className="jcloud-field">
                  <span className="jcloud-label">서비스명</span>
                  <input className="jcloud-input" placeholder="서비스 이름" />
                </label>
                <label className="jcloud-field">
                  <span className="jcloud-label">URL</span>
                  <input className="jcloud-input" placeholder="https:// 또는 도메인" />
                </label>
                <label className="jcloud-field member-service-form-wide">
                  <span className="jcloud-label">소개</span>
                  <textarea className="jcloud-textarea" rows={4} placeholder="서비스가 해결하는 문제를 적어주세요." />
                </label>
              </div>
              <div className="recruit-write-footer">
                <button type="button" className="jcloud-submit-button">등록하기</button>
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  )
}
