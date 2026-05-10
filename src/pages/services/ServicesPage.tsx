/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { routes } from '../../shared/routes'
import { ServicePage } from '../service/ServicePage'
import { memberServiceDetails, memberServices } from '../../dummy/memberServices'
import { CommunityBanner } from '../community/CommunityBanner'

export type ServiceCategory = 'productivity' | 'ai' | 'community' | 'learning'
type ServicesTab = 'coas' | 'official' | 'user'
type UserServiceViewMode = 'card' | 'list'
export type MemberServiceStatus = '운영중' | '운영중지' | '운영종료'
type ServiceStatusFilter = 'all' | MemberServiceStatus

export type MemberService = {
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

export type MemberServiceDetail = {
  audience: string
  visibility: string
  period: string
  description: string
  features: string[]
  stack: string[]
}

const USER_SERVICE_PAGE_SIZE = 4
const serviceStatusFilters: { id: ServiceStatusFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: '운영중', label: '운영중' },
  { id: '운영중지', label: '운영중지' },
  { id: '운영종료', label: '운영종료' },
]

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
        <CommunityBanner title={activeBannerTitle} tone="service" />

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
                      <p className="services-hub-eyebrow">유저 서비스</p>
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
                <SearchField
                  className="resource-search-bar"
                  value={query}
                  onChange={setQuery}
                  placeholder="서비스명, 만든 유저, 태그 검색"
                />
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
