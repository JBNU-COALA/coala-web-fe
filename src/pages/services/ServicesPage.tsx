import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { routes } from '../../shared/routes'
import { ServicePage } from '../service/ServicePage'
import { CommunityBanner } from '../community/CommunityBanner'
import { servicesApi } from '../../shared/api/services'
import { attachmentsApi } from '../../shared/api/attachments'
import { resolveServicesTab, type ServicesTab } from '../../navigation/navigationData'

export type ServiceCategory = 'productivity' | 'ai' | 'community' | 'learning'
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
  audience?: string
  visibility?: string
  period?: string
  description?: string
  features?: string[]
  stack?: string[]
}

export type MemberServiceDetail = {
  audience: string
  visibility: string
  period: string
  description: string
  features: string[]
  stack: string[]
}

const USER_SERVICE_PAGE_SIZE = 6
const serviceStatusFilters: { id: ServiceStatusFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: '운영중', label: '운영중' },
  { id: '운영중지', label: '운영중지' },
  { id: '운영종료', label: '운영종료' },
]

const toExternalUrl = (url: string) => (
  /^https?:\/\//i.test(url) ? url : `https://${url}`
)

const emptyServiceDraft = {
  title: '',
  url: '',
  githubUrl: '',
  tags: '',
  imageUrl: '',
  summary: '',
}

function serviceToDraft(service: MemberService) {
  return {
    title: service.title,
    url: service.url,
    githubUrl: service.githubUrl,
    tags: service.tags.join(', '),
    imageUrl: service.imageUrl,
    summary: service.summary,
  }
}

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
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [memberServices, setMemberServices] = useState<MemberService[]>([])
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [serviceImageError, setServiceImageError] = useState<string | null>(null)
  const [isUploadingServiceImage, setIsUploadingServiceImage] = useState(false)
  const [addDraft, setAddDraft] = useState(emptyServiceDraft)

  const normalizedQuery = query.trim().toLowerCase()
  const activeTab: ServicesTab = resolveServicesTab(location.pathname, location.search)
  const activeBannerTitle =
    activeTab === 'coas'
      ? 'COAS'
      : activeTab === 'official'
        ? '공식 서비스'
        : '유저 서비스'
  const selectedService = activeTab === 'user' && serviceId
    ? memberServices.find((service) => service.id === serviceId)
    : null
  const selectedServiceDetail = selectedService
  const showServiceForm = showAddForm || editingServiceId !== null

  const serviceTags = useMemo(
    () => Array.from(new Set(memberServices.flatMap((service) => service.tags))),
    [memberServices],
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
  }, [memberServices, normalizedQuery, selectedStatus, selectedTags])
  const totalUserServicePages = Math.max(1, Math.ceil(visibleServices.length / USER_SERVICE_PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalUserServicePages)
  const paginatedServices = visibleServices.slice(
    (safeCurrentPage - 1) * USER_SERVICE_PAGE_SIZE,
    safeCurrentPage * USER_SERVICE_PAGE_SIZE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [normalizedQuery, selectedStatus, selectedTags])

  useEffect(() => {
    servicesApi.getMemberServices()
      .then((services) => {
        setMemberServices(services as MemberService[])
        setServiceError(null)
      })
      .catch(() => setServiceError('서비스 목록을 불러오지 못했습니다.'))
  }, [])

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

  const startCreateService = () => {
    const shouldClose = showAddForm && editingServiceId === null
    setEditingServiceId(null)
    setAddDraft(emptyServiceDraft)
    setServiceError(null)
    setShowAddForm(!shouldClose)
  }

  const startEditService = (service: MemberService) => {
    setEditingServiceId(service.id)
    setAddDraft(serviceToDraft(service))
    setServiceError(null)
    setShowAddForm(true)
    navigate(routes.services.user)
  }

  const closeServiceForm = () => {
    setShowAddForm(false)
    setEditingServiceId(null)
    setAddDraft(emptyServiceDraft)
    setServiceImageError(null)
  }

  const handleSaveService = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        title: addDraft.title.trim(),
        category: 'productivity',
        summary: addDraft.summary.trim(),
        url: addDraft.url.trim(),
        githubUrl: addDraft.githubUrl.trim(),
        imageUrl: addDraft.imageUrl.trim(),
        tags: addDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      }
      const saved = editingServiceId
        ? await servicesApi.updateMemberService(editingServiceId, payload)
        : await servicesApi.createMemberService(payload)
      setMemberServices((current) => {
        const nextService = saved as MemberService
        return current.some((service) => service.id === nextService.id)
          ? current.map((service) => (service.id === nextService.id ? nextService : service))
          : [nextService, ...current]
      })
      closeServiceForm()
      setServiceError(null)
    } catch {
      setServiceError(editingServiceId ? '서비스 수정 권한이 없거나 저장에 실패했습니다.' : '서비스를 추가하지 못했습니다.')
    }
  }

  const handleServiceImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setServiceImageError('이미지 파일만 첨부할 수 있습니다.')
      return
    }

    setIsUploadingServiceImage(true)
    setServiceImageError(null)
    try {
      const uploaded = await attachmentsApi.uploadImage(file)
      setAddDraft((current) => ({ ...current, imageUrl: uploaded.url }))
    } catch (error) {
      setServiceImageError(error instanceof Error ? error.message : '이미지를 업로드하지 못했습니다.')
    } finally {
      setIsUploadingServiceImage(false)
    }
  }

  const renderServiceTags = (tags: string[]) => (
    tags.length > 0
      ? tags.map((tag) => <span key={tag}>{tag}</span>)
      : <span className="member-service-tag-empty">태그가 없습니다</span>
  )

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
                  className={
                    selectedService.imageUrl
                      ? 'member-service-detail-media'
                      : 'member-service-detail-media member-service-detail-media--empty'
                  }
                  style={selectedService.imageUrl ? { backgroundImage: `url(${selectedService.imageUrl})` } : undefined}
                >
                  {!selectedService.imageUrl ? <Icon name="image" size={28} /> : null}
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
                    {selectedService.githubUrl ? (
                      <a href={toExternalUrl(selectedService.githubUrl)} target="_blank" rel="noreferrer">
                        <Icon name="network" size={15} />
                        GitHub
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="member-service-detail-button"
                      onClick={() => startEditService(selectedService)}
                    >
                      <Icon name="edit" size={15} />
                      수정
                    </button>
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
                        {renderServiceTags(selectedServiceDetail?.stack ?? selectedService.tags)}
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
                    onClick={startCreateService}
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
                    {visibleTagOptions.length > 0 ? (
                      visibleTagOptions.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={selectedTags.includes(tag) ? 'member-service-tag-chip is-active' : 'member-service-tag-chip'}
                          aria-pressed={selectedTags.includes(tag)}
                          onClick={() => toggleSelectedTag(tag)}
                        >
                          #{tag}
                        </button>
                      ))
                    ) : (
                      <span className="member-service-tag-empty">태그가 없습니다</span>
                    )}
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

            {serviceError ? <p className="auth-error">{serviceError}</p> : null}

            {showServiceForm ? (
              <form className="surface-card member-service-form" onSubmit={handleSaveService}>
                <div className="member-service-form-head">
                  <div>
                    <h3>{editingServiceId ? '유저 서비스 수정' : '유저 서비스 추가'}</h3>
                    <p>
                      대표 이미지는 URL 입력 대신 이미지 첨부로 등록됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={closeServiceForm}
                  >
                    닫기
                  </button>
                </div>
                <div className="member-service-form-grid">
                  <label className="jcloud-field">
                    <span className="jcloud-label">서비스명</span>
                    <input
                      className="jcloud-input"
                      placeholder="서비스 이름"
                      value={addDraft.title}
                      onChange={(event) => setAddDraft({ ...addDraft, title: event.target.value })}
                      required
                    />
                  </label>
                  <label className="jcloud-field">
                    <span className="jcloud-label">URL</span>
                    <input
                      className="jcloud-input"
                      placeholder="https:// 또는 도메인"
                      value={addDraft.url}
                      onChange={(event) => setAddDraft({ ...addDraft, url: event.target.value })}
                      required
                    />
                  </label>
                  <label className="jcloud-field">
                    <span className="jcloud-label">GitHub 링크</span>
                    <input
                      className="jcloud-input"
                      placeholder="https://github.com/..."
                      value={addDraft.githubUrl}
                      onChange={(event) => setAddDraft({ ...addDraft, githubUrl: event.target.value })}
                    />
                  </label>
                  <label className="jcloud-field">
                    <span className="jcloud-label">태그</span>
                    <input
                      className="jcloud-input"
                      placeholder="AI, 생산성, 스터디"
                      value={addDraft.tags}
                      onChange={(event) => setAddDraft({ ...addDraft, tags: event.target.value })}
                      required
                    />
                  </label>
                  <label className="jcloud-field member-service-form-wide">
                    <span className="jcloud-label">이미지</span>
                    <div className="member-service-image-upload">
                      <label className="ghost-button member-service-image-upload-button">
                        <Icon name="image" size={15} />
                        {isUploadingServiceImage ? '업로드 중...' : '이미지 첨부'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleServiceImageSelect}
                          disabled={isUploadingServiceImage}
                        />
                      </label>
                      {addDraft.imageUrl ? (
                        <span
                          className="member-service-image-preview"
                          style={{ backgroundImage: `url(${addDraft.imageUrl})` }}
                        />
                      ) : (
                        <span className="member-service-image-empty">첨부된 이미지가 없습니다</span>
                      )}
                    </div>
                    {serviceImageError ? <p className="auth-error">{serviceImageError}</p> : null}
                  </label>
                  <label className="jcloud-field member-service-form-wide">
                    <span className="jcloud-label">소개</span>
                    <textarea
                      className="jcloud-textarea"
                      rows={5}
                      placeholder="서비스가 해결하는 문제와 주요 기능을 적어주세요."
                      value={addDraft.summary}
                      onChange={(event) => setAddDraft({ ...addDraft, summary: event.target.value })}
                      required
                    />
                  </label>
                </div>
                <div className="recruit-write-footer">
                  <button type="submit" className="jcloud-submit-button">
                    {editingServiceId ? '저장하기' : '추가하기'}
                  </button>
                </div>
              </form>
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
                      <div
                        className={service.imageUrl ? 'member-service-media' : 'member-service-media member-service-media--empty'}
                        style={service.imageUrl ? { backgroundImage: `url(${service.imageUrl})` } : undefined}
                      >
                        {!service.imageUrl ? <Icon name="image" size={22} /> : null}
                      </div>
                      <div className="member-service-card-head">
                        <span className="member-service-status">{service.status}</span>
                        <button
                          type="button"
                          className="member-service-edit-button"
                          aria-label={`${service.title} 수정`}
                          onClick={(event) => {
                            event.stopPropagation()
                            startEditService(service)
                          }}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                      </div>
                      <h3>{service.title}</h3>
                      <p>{service.summary}</p>
                      <div className="member-service-tags">
                        {renderServiceTags(service.tags)}
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
                          {renderServiceTags(service.tags)}
                        </div>
                      </div>
                      <div className="member-service-list-side">
                        <span>{service.owner}</span>
                        <strong>{service.url}</strong>
                        <button
                          type="button"
                          className="member-service-edit-button"
                          aria-label={`${service.title} 수정`}
                          onClick={(event) => {
                            event.stopPropagation()
                            startEditService(service)
                          }}
                        >
                          <Icon name="edit" size={14} />
                          수정
                        </button>
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
