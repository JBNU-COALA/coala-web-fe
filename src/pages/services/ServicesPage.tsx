import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { routes } from '../../shared/routes'
import { ServicePage } from '../service/ServicePage'

type ServiceCategory = 'productivity' | 'ai' | 'community' | 'learning'
type ServicesTab = 'coas' | 'official' | 'user'
type UserServiceViewMode = 'card' | 'list'
type MemberServiceStatus = '운영중' | '운영중지' | '운영종료'
type ServiceStatusFilter = 'all' | MemberServiceStatus

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
  status: MemberServiceStatus
}

type MemberServiceDetail = {
  audience: string
  visibility: string
  period: string
  description: string
  features: string[]
  stack: string[]
}

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
    status: '운영중',
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
    status: '운영중',
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
    status: '운영중',
  },
  {
    id: 'algo-room',
    title: 'Algo Room',
    category: 'learning',
    owner: '정하윤',
    summary: '알고리즘 문제 풀이 기록과 스터디 과제를 모아보는 서비스입니다.',
    url: 'algo-room.coala.dev',
    githubUrl: 'https://github.com/JBNU-COALA/algo-room',
    imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    tags: ['알고리즘', '스터디', '기록'],
    status: '운영중',
  },
  {
    id: 'lab-board',
    title: 'Lab Board',
    category: 'community',
    owner: '서지우',
    summary: '연구실 모집, 세미나, 인턴 정보를 정리하는 게시판형 서비스입니다.',
    url: 'lab-board.coala.dev',
    githubUrl: 'https://github.com/JBNU-COALA/lab-board',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
    tags: ['연구실', '세미나', '정보'],
    status: '운영중지',
  },
  {
    id: 'resume-kit',
    title: 'Resume Kit',
    category: 'productivity',
    owner: '강민재',
    summary: '포트폴리오와 이력서 초안을 팀원끼리 리뷰할 수 있게 만든 도구입니다.',
    url: 'resume-kit.coala.dev',
    githubUrl: 'https://github.com/JBNU-COALA/resume-kit',
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    tags: ['포트폴리오', '리뷰', '문서'],
    status: '운영종료',
  },
  {
    id: 'prompt-vault',
    title: 'Prompt Vault',
    category: 'ai',
    owner: '오유진',
    summary: '프로젝트에서 사용한 프롬프트와 실험 결과를 정리하는 아카이브입니다.',
    url: 'prompt-vault.coala.dev',
    githubUrl: 'https://github.com/JBNU-COALA/prompt-vault',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
    tags: ['AI', '프롬프트', '실험'],
    status: '운영중',
  },
  {
    id: 'team-clock',
    title: 'Team Clock',
    category: 'productivity',
    owner: '윤태현',
    summary: '팀별 개발 시간, 회의 기록, 마감 일정을 가볍게 관리합니다.',
    url: 'team-clock.coala.dev',
    githubUrl: 'https://github.com/JBNU-COALA/team-clock',
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    tags: ['팀', '일정', '생산성'],
    status: '운영중지',
  },
]

const USER_SERVICE_PAGE_SIZE = 4
const serviceStatusFilters: { id: ServiceStatusFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: '운영중', label: '운영중' },
  { id: '운영중지', label: '운영중지' },
  { id: '운영종료', label: '운영종료' },
]

const memberServiceDetails: Record<string, MemberServiceDetail> = {
  'paper-scout': {
    audience: '연구·논문 스터디',
    visibility: 'Public',
    period: '2026.03 ~ 운영 중',
    description: '키워드 기반으로 논문 후보를 모으고, 팀원이 읽을 자료를 빠르게 선별하는 서비스입니다.',
    features: ['키워드별 논문 후보 저장', '요약 메모와 읽음 상태 관리', '스터디 공유 링크 생성'],
    stack: ['React', 'Node.js', 'LLM API', 'PostgreSQL'],
  },
  'study-mate': {
    audience: '스터디 운영자',
    visibility: 'Public',
    period: '2026.02 ~ 운영 중',
    description: '스터디 일정과 과제, 출석 체크를 한 화면에서 관리하기 위한 서비스입니다.',
    features: ['스터디별 일정표', '과제 제출 체크', '출석 기록 관리'],
    stack: ['React', 'Django', 'SQLite', 'Calendar'],
  },
  'deploy-note': {
    audience: '프로젝트 팀',
    visibility: 'Public',
    period: '2026.01 ~ 운영 중',
    description: '배포 전 확인해야 할 항목과 릴리즈 노트를 서비스 단위로 남기는 도구입니다.',
    features: ['배포 체크리스트', '릴리즈 노트 템플릿', '팀별 운영 기록'],
    stack: ['React', 'Express', 'Markdown', 'GitHub Actions'],
  },
  'algo-room': {
    audience: '알고리즘 스터디',
    visibility: 'Public',
    period: '2025.12 ~ 운영 중',
    description: '문제 풀이 기록과 스터디 과제를 모아보고, 회차별 진행 상황을 확인합니다.',
    features: ['회차별 문제 묶음', '풀이 기록', '스터디 과제 상태'],
    stack: ['React', 'Spring Boot', 'MySQL', 'Baekjoon'],
  },
  'lab-board': {
    audience: '연구실 정보 공유',
    visibility: 'Public',
    period: '2025.11 ~ 운영 중지',
    description: '연구실 모집, 세미나, 학부생 인턴 정보를 게시판 형태로 정리한 서비스입니다.',
    features: ['연구실 공고 목록', '세미나 일정 정리', '관심 연구실 저장'],
    stack: ['Vue', 'Firebase', 'Markdown'],
  },
  'resume-kit': {
    audience: '취업·포트폴리오 준비',
    visibility: 'Public',
    period: '2025.09 ~ 운영 종료',
    description: '포트폴리오와 이력서 초안을 팀원끼리 리뷰하고 개선 기록을 남기는 도구입니다.',
    features: ['리뷰 요청', '체크리스트', '수정 이력'],
    stack: ['React', 'NestJS', 'PostgreSQL'],
  },
  'prompt-vault': {
    audience: 'AI 프로젝트 팀',
    visibility: 'Public',
    period: '2026.04 ~ 운영 중',
    description: '프로젝트에서 사용한 프롬프트와 실험 결과를 재사용 가능한 형태로 모읍니다.',
    features: ['프롬프트 버전 관리', '실험 결과 기록', '태그 기반 검색'],
    stack: ['React', 'FastAPI', 'Vector DB', 'LLM API'],
  },
  'team-clock': {
    audience: '팀 프로젝트',
    visibility: 'Public',
    period: '2025.10 ~ 운영 중지',
    description: '개발 시간, 회의 기록, 마감 일정을 가볍게 정리하는 팀 운영 도구입니다.',
    features: ['회의 로그', '마감 일정', '팀별 활동 시간'],
    stack: ['Svelte', 'Node.js', 'SQLite'],
  },
}

const toExternalUrl = (url: string) => (
  /^https?:\/\//i.test(url) ? url : `https://${url}`
)

export function ServicesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { serviceId } = useParams<{ serviceId?: string }>()
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatusFilter>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<UserServiceViewMode>('card')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)

  const normalizedQuery = query.trim().toLowerCase()
  const legacyTab = new URLSearchParams(location.search).get('tab')
  const activeTab: ServicesTab = location.pathname.startsWith('/services/official') || legacyTab === 'official'
    ? 'official'
    : location.pathname.startsWith('/services/user') ||
        location.pathname.startsWith('/services/unofficial') ||
        legacyTab === 'user' ||
        legacyTab === 'unofficial'
      ? 'user'
      : 'coas'
  const activeBannerTitle =
    activeTab === 'coas'
      ? 'COAS'
      : activeTab === 'official'
        ? '공식 서비스'
        : '유저 서비스'
  const selectedService = activeTab === 'user' && serviceId
    ? memberServices.find((service) => service.id === serviceId)
    : null
  const selectedServiceDetail = selectedService ? memberServiceDetails[selectedService.id] : null

  const serviceTags = useMemo(
    () => Array.from(new Set(memberServices.flatMap((service) => service.tags))),
    [],
  )
  const visibleTagOptions = serviceTags.slice(0, 5)

  const visibleServices = useMemo(() => {
    return memberServices.filter((service) => {
      if (selectedStatus !== 'all' && service.status !== selectedStatus) return false
      if (selectedTags.length > 0 && !selectedTags.some((tag) => service.tags.includes(tag))) return false
      if (!normalizedQuery) return true

      return `${service.title} ${service.owner} ${service.summary} ${service.tags.join(' ')}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [normalizedQuery, selectedStatus, selectedTags])
  const totalUserServicePages = Math.max(1, Math.ceil(visibleServices.length / USER_SERVICE_PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalUserServicePages)
  const paginatedServices = visibleServices.slice(
    (safeCurrentPage - 1) * USER_SERVICE_PAGE_SIZE,
    safeCurrentPage * USER_SERVICE_PAGE_SIZE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [normalizedQuery, selectedStatus, selectedTags])

  const toggleSelectedTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    )
  }

  const openServiceDetail = (id: string) => {
    navigate(routes.services.userDetail(id))
  }

  const handleServiceItemKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openServiceDetail(id)
  }

  return (
    <section className="coala-content coala-content--services">
      <div className="member-services">
        <header className="member-services-hero">
          <div>
            <h2>{activeBannerTitle}</h2>
          </div>
        </header>

        {activeTab === 'coas' ? (
          <section className="surface-card cossp-panel">
            <div className="cossp-visual" role="img" aria-label="Coala Open Source Project typography">
              <span>Coala</span>
              <span>Open Source</span>
              <span>Project</span>
            </div>
            <div className="cossp-copy">
              <p className="services-hub-eyebrow">COAS</p>
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
        ) : selectedService ? (
              <article className="surface-card member-service-detail">
                <div
                  className="member-service-detail-media"
                  style={{ backgroundImage: `url(${selectedService.imageUrl})` }}
                >
                  <span className="member-service-status">{selectedService.status}</span>
                </div>

                <div className="member-service-detail-body">
                  <header className="member-service-detail-header">
                    <button
                      type="button"
                      className="ghost-button member-service-back-button"
                      onClick={() => navigate(routes.services.user)}
                    >
                      <Icon name="chevron-left" size={15} />
                      목록으로 돌아가기
                    </button>
                    <div>
                      <p className="services-hub-eyebrow">USER SERVICE</p>
                      <h3>{selectedService.title}</h3>
                      <span>{selectedService.owner}</span>
                    </div>
                  </header>

                  <p className="member-service-detail-summary">
                    {selectedServiceDetail?.description ?? selectedService.summary}
                  </p>

                  <div className="member-service-detail-actions">
                    <a href={toExternalUrl(selectedService.url)} target="_blank" rel="noreferrer">
                      <Icon name="link" size={15} />
                      서비스 열기
                    </a>
                    <a href={selectedService.githubUrl} target="_blank" rel="noreferrer">
                      <Icon name="network" size={15} />
                      GitHub
                    </a>
                  </div>

                  <dl className="member-service-detail-meta">
                    <div>
                      <dt>대상</dt>
                      <dd>{selectedServiceDetail?.audience ?? '코알라 부원'}</dd>
                    </div>
                    <div>
                      <dt>도메인</dt>
                      <dd>{selectedService.url}</dd>
                    </div>
                    <div>
                      <dt>공개</dt>
                      <dd>{selectedServiceDetail?.visibility ?? 'Public'}</dd>
                    </div>
                    <div>
                      <dt>기간</dt>
                      <dd>{selectedServiceDetail?.period ?? selectedService.status}</dd>
                    </div>
                  </dl>

                  <div className="member-service-detail-grid">
                    <section>
                      <h4>주요 기능</h4>
                      <ul>
                        {(selectedServiceDetail?.features ?? [selectedService.summary]).map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h4>기술 스택</h4>
                      <div className="member-service-detail-tags">
                        {(selectedServiceDetail?.stack ?? selectedService.tags).map((stack) => (
                          <span key={stack}>{stack}</span>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </article>
        ) : serviceId ? (
              <section className="surface-card member-service-detail-empty">
                <strong>서비스를 찾을 수 없습니다.</strong>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => navigate(routes.services.user)}
                >
                  목록으로 돌아가기
                </button>
              </section>
        ) : (
          <>
            <div className="member-services-toolbar surface-card">
              <div className="member-services-toolbar-head">
                <div>
                  <span>전체 {visibleServices.length}개</span>
                  <strong>유저 서비스</strong>
                </div>
                <div className="member-services-toolbar-actions">
                  <div className="member-service-view-toggle" aria-label="보기 방식">
                    <button
                      type="button"
                      className={viewMode === 'card' ? 'is-active' : ''}
                      aria-pressed={viewMode === 'card'}
                      onClick={() => setViewMode('card')}
                    >
                      <Icon name="layout" size={15} />
                      카드
                    </button>
                    <button
                      type="button"
                      className={viewMode === 'list' ? 'is-active' : ''}
                      aria-pressed={viewMode === 'list'}
                      onClick={() => setViewMode('list')}
                    >
                      <Icon name="list" size={15} />
                      목록
                    </button>
                  </div>
                  <button
                    type="button"
                    className="member-service-add-button"
                    onClick={() => setShowAddForm((current) => !current)}
                  >
                    <Icon name="plus" size={15} />
                    서비스 추가
                  </button>
                </div>
              </div>

              <div className="member-service-filter-grid">
                <div className="member-service-filter-group">
                  <span className="member-service-filter-label">상태</span>
                  <div className="member-service-status-filter" aria-label="유저 서비스 운영 상태">
                    {serviceStatusFilters.map((status) => (
                      <button
                        key={status.id}
                        type="button"
                        className={selectedStatus === status.id ? 'is-active' : ''}
                        aria-pressed={selectedStatus === status.id}
                        onClick={() => setSelectedStatus(status.id)}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="member-service-filter-group">
                  <div className="member-service-tag-tools">
                    <span className="member-service-filter-label">태그</span>
                    {selectedTags.length > 0 ? (
                      <button type="button" className="member-service-tag-reset" onClick={() => setSelectedTags([])}>
                        초기화
                      </button>
                    ) : null}
                  </div>
                  <div className="member-service-tag-cloud" aria-label="유저 서비스 태그">
                    {visibleTagOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={selectedTags.includes(tag) ? 'member-service-tag-chip is-active' : 'member-service-tag-chip'}
                        aria-pressed={selectedTags.includes(tag)}
                        onClick={() => toggleSelectedTag(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="member-services-toolbar-bottom">
                <label className="resource-search-bar">
                  <Icon name="search" size={15} />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="서비스명, 만든 유저, 태그 검색"
                  />
                </label>
              </div>
            </div>

            {showAddForm ? (
              <section className="surface-card member-service-form">
                <div className="member-service-form-head">
                  <div>
                    <h3>유저 서비스 추가</h3>
                    <p>
                      서비스 등록 요청은 아래 내용을 정리해서 coala.jbnu@gmail.com 으로 보내주세요.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setShowAddForm(false)}
                  >
                    닫기
                  </button>
                </div>
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
                  <button type="button" className="jcloud-submit-button">추가하기</button>
                </div>
              </section>
            ) : null}

            <ul className={viewMode === 'card' ? 'member-service-grid' : 'member-service-list'}>
              {paginatedServices.map((service) => (
                <li
                  key={service.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${service.title} 서비스 안내 열기`}
                  onClick={() => openServiceDetail(service.id)}
                  onKeyDown={(event) => handleServiceItemKeyDown(event, service.id)}
                  className={
                    viewMode === 'card'
                      ? 'surface-card member-service-card member-service-card--with-media'
                      : 'surface-card member-service-list-item'
                  }
                >
                  {viewMode === 'card' ? (
                    <>
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
                      <footer className="member-service-card-footer">
                        <div>
                          <span>{service.owner}</span>
                          <strong>{service.url}</strong>
                        </div>
                        <span className="member-service-open-hint">안내 보기</span>
                      </footer>
                    </>
                  ) : (
                    <>
                      <div className="member-service-list-main">
                        <span className="member-service-status">{service.status}</span>
                        <h3>{service.title}</h3>
                        <p>{service.summary}</p>
                        <div className="member-service-tags">
                          {service.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="member-service-list-side">
                        <span>{service.owner}</span>
                        <strong>{service.url}</strong>
                        <span className="member-service-open-hint">안내 보기</span>
                      </div>
                    </>
                  )}
                </li>
              ))}
              {paginatedServices.length === 0 ? (
                <li className="surface-card empty-post-state">조건에 맞는 서비스가 없습니다.</li>
              ) : null}
            </ul>

            {totalUserServicePages > 1 ? (
              <nav className="board-pagination member-service-pagination" aria-label="유저 서비스 페이지">
                <button
                  type="button"
                  className="page-button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  aria-label="이전 페이지"
                >
                  <Icon name="chevron-left" size={15} />
                </button>
                {Array.from({ length: totalUserServicePages }, (_, index) => {
                  const page = index + 1
                  return (
                    <button
                      key={page}
                      type="button"
                      className={safeCurrentPage === page ? 'page-button is-active' : 'page-button'}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  type="button"
                  className="page-button"
                  disabled={safeCurrentPage === totalUserServicePages}
                  onClick={() => setCurrentPage((page) => Math.min(totalUserServicePages, page + 1))}
                  aria-label="다음 페이지"
                >
                  <Icon name="chevron-right" size={15} />
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
