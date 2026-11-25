import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { usePageTransition } from '../../shared/ui/usePageTransition'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { TechLogo } from '../../shared/ui/TechLogo'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { ViewModeToggle } from '../../shared/ui/ViewModeToggle'
import { type FilterTabOption } from '../../shared/ui/FilterTabs'
import { ListingControls } from '../../shared/ui/ListingControls'
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner'
import { SelectControl } from '../../shared/ui/SelectControl'
import { SafeImage } from '../../shared/ui/SafeImage'
import { routes } from '../../shared/routes'
import { ServicePage } from '../service/ServicePage'
import { DomainServicePanel } from '../service/DomainServicePanel'
import { CommunityBanner } from '../community/CommunityBanner'
import { servicesApi } from '../../shared/api/services'
import { attachmentsApi } from '../../shared/api/attachments'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { resolveServicesTab, type ServicesTab } from '../../navigation/navigationData'
import './services-hub.css'

export type ServiceCategory = 'productivity' | 'ai' | 'community' | 'learning'
type UserServiceViewMode = 'card' | 'list'
type OfficialServiceMode = 'instance' | 'domain'
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
  additionalImageUrls?: string[]
  tags: string[]
  status: MemberServiceStatus
  audience?: string
  visibility?: string
  period?: string
  description?: string
  features?: string[]
  stack?: string[]
  canEdit?: boolean
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
const serviceStatusTabs: FilterTabOption<ServiceStatusFilter>[] = serviceStatusFilters.map((status) => ({
  id: status.id,
  label: status.label,
  tone: status.id === 'all' ? 'all' : 'status',
}))

const toExternalUrl = (url: string) => (
  /^https?:\/\//i.test(url) ? url : `https://${url}`
)

const toServiceImageUrl = (url?: string | null) => (url ? resolveApiAssetUrl(url) : '')

const emptyServiceDraft = {
  title: '',
  url: '',
  githubUrl: '',
  tags: '',
  imageUrl: '',
  additionalImageUrls: [] as string[],
  summary: '',
}

function serviceToDraft(service: MemberService) {
  return {
    title: service.title,
    url: service.url,
    githubUrl: service.githubUrl,
    tags: service.tags.join(', '),
    imageUrl: service.imageUrl,
    additionalImageUrls: service.additionalImageUrls ?? [],
    summary: service.summary,
  }
}

function resolveOfficialMode(pathname: string): OfficialServiceMode {
  return pathname === routes.services.domain ||
    pathname === routes.services.officialDomain ||
    pathname.startsWith('/services/official/domain')
    ? 'domain'
    : 'instance'
}

export function ServicesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { serviceId } = useParams<{ serviceId?: string }>()
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatusFilter>('all')
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<UserServiceViewMode>('card')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [memberServices, setMemberServices] = useState<MemberService[]>([])
  const [retireTarget, setRetireTarget] = useState<MemberService | null>(null)
  const [retiring, setRetiring] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [listRevision, setListRevision] = useState(0)
  const [serviceImageError, setServiceImageError] = useState<string | null>(null)
  const [isUploadingServiceImage, setIsUploadingServiceImage] = useState(false)
  const [addDraft, setAddDraft] = useState(emptyServiceDraft)
  const officialMode = resolveOfficialMode(location.pathname)

  const normalizedQuery = query.trim().toLowerCase()
  const activeTab: ServicesTab = resolveServicesTab(location.pathname, location.search)
  const activeBannerTitle =
    activeTab === 'coas'
      ? 'COAS'
      : activeTab === 'official'
        ? (officialMode === 'instance' ? 'JCloud 인스턴스 신청' : '도메인 신청')
        : '유저 서비스'
  const activeBannerDescription =
    activeTab === 'coas'
      ? '코알라와 함께 만들어가는 오픈소스 프로젝트를 소개해요.'
      : activeTab === 'official'
        ? (officialMode === 'instance' ? 'JCloud에서 제공하는 인스턴스를 신청하고 이용하세요.' : '프로젝트에 사용할 코알라 도메인을 신청하세요.')
        : '코알라 멤버들이 직접 만든 서비스를 둘러보세요.'
  const selectedService = activeTab === 'user' && serviceId
    ? memberServices.find((service) => service.id === serviceId)
    : null
  const selectedServiceDetail = selectedService
  const showServiceForm = showAddForm || editingServiceId !== null
  const formRef = usePageTransition<HTMLFormElement>(String(showServiceForm))

  const visibleServices = useMemo(() => {
    return memberServices.filter((service) => {
      if (selectedStatus !== 'all' && service.status !== selectedStatus) return false
      if (!normalizedQuery) return true

      return `${service.title} ${service.owner} ${service.summary} ${service.tags.join(' ')}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [memberServices, normalizedQuery, selectedStatus])
  const totalUserServicePages = Math.max(1, Math.ceil(visibleServices.length / USER_SERVICE_PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalUserServicePages)
  const paginatedServices = visibleServices.slice(
    (safeCurrentPage - 1) * USER_SERVICE_PAGE_SIZE,
    safeCurrentPage * USER_SERVICE_PAGE_SIZE,
  )

  useEffect(() => {
    let active = true
    servicesApi.getMemberServices()
      .then((services) => {
        if (!active) return
        setMemberServices(services as MemberService[])
        setListError(null)
      })
      .catch(() => { if (active) setListError('서비스 목록을 불러오지 못했습니다.') })
      .finally(() => { if (active) setListLoading(false) })
    return () => { active = false }
  }, [listRevision])

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
        additionalImageUrls: addDraft.additionalImageUrls.slice(0, 5),
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

  const handleRetireService = async (service: MemberService) => {
    if (retiring) return
    setRetireTarget(null)
    setRetiring(true)

    try {
      await servicesApi.retireMemberService(service.id)
      setMemberServices((current) =>
        current.map((item) => (
          item.id === service.id
            ? { ...item, status: '운영중지', visibility: 'Private', period: '운영 중지' }
            : item
        )),
      )
      navigate(routes.services.user)
      setServiceError(null)
    } catch {
      setServiceError('서비스 운영 중지 권한이 없거나 처리에 실패했습니다.')
    } finally {
      setRetiring(false)
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

  const handleAdditionalServiceImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const availableSlots = Math.max(0, 5 - addDraft.additionalImageUrls.length)
    const selectedFiles = files.slice(0, availableSlots)

    if (availableSlots === 0) {
      setServiceImageError('추가 이미지는 최대 5개까지 등록할 수 있습니다.')
      return
    }

    if (selectedFiles.some((file) => !file.type.startsWith('image/'))) {
      setServiceImageError('이미지 파일만 첨부할 수 있습니다.')
      return
    }

    setIsUploadingServiceImage(true)
    setServiceImageError(null)
    try {
      const uploadedImages = await Promise.all(selectedFiles.map((file) => attachmentsApi.uploadImage(file)))
      setAddDraft((current) => ({
        ...current,
        additionalImageUrls: [
          ...current.additionalImageUrls,
          ...uploadedImages.map((image) => image.url),
        ].slice(0, 5),
      }))
      if (files.length > selectedFiles.length) {
        setServiceImageError('추가 이미지는 최대 5개까지만 등록됩니다.')
      }
    } catch (error) {
      setServiceImageError(error instanceof Error ? error.message : '이미지를 업로드하지 못했습니다.')
    } finally {
      setIsUploadingServiceImage(false)
    }
  }

  const removeAdditionalServiceImage = (imageUrl: string) => {
    setAddDraft((current) => ({
      ...current,
      additionalImageUrls: current.additionalImageUrls.filter((url) => url !== imageUrl),
    }))
  }

  const renderServiceTags = (tags: string[]) => (
    tags.length > 0
      ? tags.map((tag) => <span key={tag}><TechLogo name={tag} />{tag}</span>)
      : <span className="member-service-tag-empty">태그가 없습니다</span>
  )

  return (
    <section className="coala-content coala-content--services">
      <div className="member-services">
        <CommunityBanner title={activeBannerTitle} description={activeBannerDescription} tone="service" />

        {activeTab === 'coas' ? (
          <div className="coas-hub">
            <section className="coas-intro" aria-labelledby="coas-title">
              <div className="coas-intro-copy">
                <p className="coas-kicker">COAS · 코알라 오픈소스</p>
                <h2 id="coas-title">함께 만들고,<br />직접 운영하는 서비스.</h2>
                <p className="coas-description">동아리에서 만든 프로젝트를 실제 서비스로 이어갑니다.<br />서버와 도메인을 신청하고, GitHub에서 함께 개발해 보세요.</p>
                <div className="coas-actions">
                  <button type="button" onClick={() => navigate(routes.services.official)}>서비스 둘러보기 <Icon name="chevron-right" size={16} /></button>
                  <a href="https://github.com/JBNU-COALA" target="_blank" rel="noopener noreferrer"><Icon name="github" size={20} /> GitHub <span className="coas-external-label"><Icon name="chevron-right" size={16} /><span className="coas-sr-only"> (새 탭)</span></span></a>
                </div>
              </div>
              <div className="coas-project-banner" aria-label="COAS, Coala Open Source Project">
                <div className="coas-project-topline">
                  <span><Icon name="github" size={18} /> JBNU-COALA</span>
                  <span className="coas-project-public">Open source</span>
                </div>
                <div className="coas-project-identity">
                  <img src="/coala-logo.svg" alt="" />
                  <div><strong>COAS<span>.</span></strong><p>Coala Open Source Project</p></div>
                </div>

                <div className="coas-project-bottomline"><span aria-hidden="true">&lt;/&gt;</span></div>
              </div>
            </section>

            <section className="services-showcase" aria-label="서비스 둘러보기">
              <header className="services-showcase-head">
                <div><h3>공식 서비스</h3></div>
                <button type="button" onClick={() => navigate(routes.services.official)}>전체 보기</button>
              </header>
              <div className="official-service-preview-grid">
                <button type="button" onClick={() => navigate(routes.services.officialInstance)}>
                  <Icon name="server-color" size={28} />
                  <span><strong>JCloud 인스턴스 대여</strong><small>JCloud에서 프로젝트를 배포할 서버를 신청합니다.</small></span>
                  <Icon name="chevron-right" size={17} />
                </button>
                <button type="button" onClick={() => navigate(routes.services.officialDomain)}>
                  <Icon name="globe-color" size={28} />
                  <span><strong>도메인 신청</strong><small>코알라 도메인으로 서비스를 공개합니다.</small></span>
                  <Icon name="chevron-right" size={17} />
                </button>
              </div>
            </section>

            <section className="services-showcase" aria-label="유저 서비스 미리보기">
              <header className="services-showcase-head">
                <div><h3>유저 서비스</h3></div>
                <button type="button" onClick={() => navigate(routes.services.user)}>전체 보기</button>
              </header>
              <div className="member-service-preview-grid">
                {memberServices.slice(0, 3).map((service) => (
                  <button key={service.id} type="button" onClick={() => openServiceDetail(service.id)}>
                    <span className="member-service-preview-image">
                      <SafeImage
                        src={service.imageUrl ? toServiceImageUrl(service.imageUrl) : '/portal-koala-team.png'}
                        alt=""
                        loading="lazy"
                        fallback={<img src="/portal-koala-team.png" alt="" loading="lazy" />}
                      />
                    </span>
                    <span className="member-service-preview-copy">
                      <small>{service.status}</small>
                      <strong>{service.title}</strong>
                      <span>{service.summary}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : activeTab === 'official' ? (
          <div className="official-service-panel">
            {officialMode === 'instance' ? (
              <ServicePage embedded />
            ) : (
              <DomainServicePanel />
            )}
          </div>
        ) : selectedService ? (
          <>
                    <button
                      type="button"
                      className="ghost-button member-service-back-button"
                      onClick={() => navigate(routes.services.user)}
                    >
                      <Icon name="chevron-left" size={15} />
                      목록으로 돌아가기
                    </button>
              <article className="surface-card member-service-detail">
                <div
                  className={
                    selectedService.imageUrl
                      ? 'member-service-detail-media'
                      : 'member-service-detail-media member-service-detail-media--empty'
                  }
                >
                  <SafeImage
                    src={selectedService.imageUrl ? toServiceImageUrl(selectedService.imageUrl) : '/portal-koala-team.png'}
                    alt=""
                    fallback={<img src="/portal-koala-team.png" alt="" />}
                  />
                  <span className="member-service-status">{selectedService.status}</span>
                </div>

                <div className="member-service-detail-body">
                  <header className="member-service-detail-header">

                    <div>
                      <p className="services-hub-eyebrow">유저 서비스</p>
                      <h3>{selectedService.title}</h3>
                      {selectedService.owner && selectedService.owner !== '코알라' && <span>{selectedService.owner}</span>}
                    </div>
                  </header>

                  <p className="member-service-detail-summary">
                    {selectedServiceDetail?.description ?? selectedService.summary}
                  </p>

                  {serviceError && <p className="auth-error" role="alert">{serviceError}</p>}
                  <div className="member-service-detail-actions">
                    <a href={toExternalUrl(selectedService.url)} target="_blank" rel="noreferrer">
                      <Icon name="globe-color" size={15} />
                      서비스 열기
                    </a>
                    {selectedService.githubUrl ? (
                      <a href={toExternalUrl(selectedService.githubUrl)} target="_blank" rel="noreferrer">
                        <Icon name="github" size={15} />
                        GitHub
                      </a>
                    ) : null}
                    {selectedService.canEdit ? (
                      <>
                        <button
                          type="button"
                          className="member-service-detail-button"
                          onClick={() => startEditService(selectedService)}
                        >
                          <Icon name="pencil-color" size={15} />
                          수정
                        </button>
                        <button
                          type="button"
                          className="member-service-detail-button"
                          disabled={retiring}
                          onClick={() => setRetireTarget(selectedService)}
                        >
                          <Icon name="stop-color" size={15} />
                          운영 중지
                        </button>
                      </>
                    ) : null}
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
                  {(selectedService.additionalImageUrls ?? []).length > 0 ? (
                    <section className="member-service-gallery" aria-label="서비스 추가 이미지">
                      {(selectedService.additionalImageUrls ?? []).slice(0, 5).map((imageUrl) => (
                        <span
                          key={imageUrl}
                          className="member-service-gallery-image"
                          style={{ backgroundImage: `url(${toServiceImageUrl(imageUrl)})` }}
                        />
                      ))}
                    </section>
                  ) : null}
                </div>
              </article>
          </>
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
            <ListingControls className="page-container" label="유저 서비스 필터">
              <SelectControl value={selectedStatus}
                options={serviceStatusTabs.map((tab) => ({ value: tab.id, label: tab.label }))}
                onChange={(status) => { setSelectedStatus(status); setCurrentPage(1) }} label="운영 상태" />
              <SearchField value={query} onChange={(value) => { setQuery(value); setCurrentPage(1) }} placeholder="서비스명, 만든 유저, 태그 검색" />
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
              <button type="button" className="write-post-button" onClick={startCreateService}><Icon name="plus" size={15} />서비스 추가</button>
            </ListingControls>

            {serviceError ? <p className="auth-error">{serviceError}</p> : null}

            {showServiceForm ? (
              <form ref={formRef} className="surface-card member-service-form" onSubmit={handleSaveService}>
                <div className="member-service-form-head">
                  <div>
                    <h3>{editingServiceId ? '유저 서비스 수정' : '유저 서비스 추가'}</h3>
                    <p>
                      서비스 정보와 대표 이미지를 등록하세요.
                    </p>
                  </div>

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
                    <span className="jcloud-label member-service-github-label"><Icon name="github" size={16} />GitHub 링크</span>
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
                  <div className="jcloud-field member-service-form-wide">
                    <span className="jcloud-label">이미지</span>
                    <div className="member-service-image-upload">
                      <label className="member-service-image-upload-button">
                        <Icon name="plus" size={24} />
                        {isUploadingServiceImage && <span>업로드 중...</span>}
                        <input
                          type="file"
                          accept="image/*"
                          aria-label="이미지 첨부"
                          onChange={handleServiceImageSelect}
                          disabled={isUploadingServiceImage}
                        />
                      </label>
                      {addDraft.imageUrl && <SafeImage key={addDraft.imageUrl}
                        className="member-service-image-preview" src={toServiceImageUrl(addDraft.imageUrl)} alt="대표 이미지 미리보기" />}

                    </div>
                    {serviceImageError ? <p className="auth-error">{serviceImageError}</p> : null}
                  </div>
                  <div className="jcloud-field member-service-form-wide">
                    <span className="jcloud-label">추가 이미지 ({addDraft.additionalImageUrls.length}/5)</span>
                    <div className="member-service-image-upload">
                      <label className="member-service-image-upload-button">
                        <Icon name="plus" size={24} />
                        {isUploadingServiceImage && <span>업로드 중...</span>}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          aria-label="추가 이미지 첨부"
                          onChange={handleAdditionalServiceImageSelect}
                          disabled={isUploadingServiceImage || addDraft.additionalImageUrls.length >= 5}
                        />
                      </label>
                      {addDraft.additionalImageUrls.length > 0 ? (
                        <div className="member-service-extra-preview-list">
                          {addDraft.additionalImageUrls.map((imageUrl) => (
                            <span
                              key={imageUrl}
                              className="member-service-extra-preview"
                            >
                              <SafeImage src={toServiceImageUrl(imageUrl)} alt="추가 이미지 미리보기" />
                              <button
                                type="button"
                                aria-label="추가 이미지 제거"
                                onClick={() => removeAdditionalServiceImage(imageUrl)}
                              >
                                <Icon name="close" size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
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
                  <button type="button" className="ghost-button" onClick={closeServiceForm}>닫기</button>
                  <button type="submit" className="jcloud-submit-button">
                    {editingServiceId ? '저장하기' : '추가하기'}
                  </button>
                </div>
              </form>
            ) : null}

            {!showServiceForm && <>
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
                      <div className="member-service-media">
                        <SafeImage
                          src={service.imageUrl ? toServiceImageUrl(service.imageUrl) : '/portal-koala-team.png'}
                          alt=""
                          loading="lazy"
                          fallback={<img src="/portal-koala-team.png" alt="" loading="lazy" />}
                        />
                      </div>
                      <div className="member-service-card-head">
                        <h3>{service.title}</h3>
                        <span className="member-service-status">{service.status}</span>

                      </div>
                      <p>{service.summary}</p>
                      <footer className="member-service-card-footer">
                        <div>
                          <span>{service.owner}</span>
                        </div>
                        <Icon name="chevron-right" size={18} />
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

                        <span className="member-service-open-hint">안내 보기</span>
                      </div>
                    </>
                  )}
                </li>
              ))}
              {listLoading ? <li className="empty-post-state"><LoadingSpinner label="서비스를 불러오는 중입니다." /></li> : listError ? (
                <li className="empty-post-state"><p role="alert">{listError}</p><button type="button" className="ghost-button retry-button" onClick={() => { setListLoading(true); setListError(null); setListRevision((value) => value + 1) }}>다시 불러오기</button></li>
              ) : paginatedServices.length === 0 ? (
                <li className="empty-post-state">조건에 맞는 서비스가 없습니다.</li>
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
            </>}
          </>
        )}
      </div>
      <ConfirmDialog open={retireTarget !== null} title="서비스 운영을 중지할까요?"
        description={`${retireTarget?.title ?? ''} 서비스를 운영 중지합니다.`}
        confirmLabel="운영 중지" cancelLabel="취소"
        onCancel={() => setRetireTarget(null)}
        onConfirm={() => { if (retireTarget) void handleRetireService(retireTarget) }} />
    </section>
  )
}
